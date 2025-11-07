import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { v7 as uuidv7 } from 'uuid';
import dayjs from 'dayjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Tính toán Target date dựa trên giá trị Step (có thể là số hoặc dải số).
 * Step = "1" => target = today + 1 day
 * Step = "7-15" => target = today + random(7 to 15) days
 */
function calculateNewTarget(steps: string): string {
  const today = dayjs().startOf('day');
  let daysToAdd = 0;

  const parts = steps.split('-');

  if (parts.length === 1) {
    // Xử lý các step là số đơn: "0", "1", "2"
    daysToAdd = parseInt(steps, 10);
  } else if (parts.length === 2) {
    // Xử lý các step là dải số: "3-6", "7-15", "0-50"
    const min = parseInt(parts[0], 10);
    const max = parseInt(parts[1], 10);
    
    if (!isNaN(min) && !isNaN(max) && min <= max) {
      // Tạo số ngày ngẫu nhiên trong dải [min, max]
      daysToAdd = Math.floor(Math.random() * (max - min + 1)) + min;
    } else {
      daysToAdd = 0; // Fallback cho dải không hợp lệ
    }
  }

  // Đảm bảo daysToAdd là một số hợp lệ (>= 0)
  if (isNaN(daysToAdd) || daysToAdd < 0) daysToAdd = 0;

  return today.add(daysToAdd, "day").format("YYYY-MM-DD");
}


export async function GET() {
  const { data, error } = await supabase
    .from('vocabularies')
    .select(`
      id,
      english,
      vietnamese,
      ipa,
      example,
      collection,
      part_of_speech,
      target,
      step
    `)
    .order('target', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const mappedData = data.map((item) => ({
    id: item.id,
    english: item.english,
    vietnamese: item.vietnamese,
    ipa: item.ipa,
    example: item.example,
    collection: item.collection,
    partOfSpeech: item.part_of_speech,
    target: item.target,
    steps: item.step,
  }));

  return NextResponse.json(mappedData);
}

export async function DELETE(request: Request) {
  try {
    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Danh sách ID không hợp lệ" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("vocabularies")
      .delete()
      .in("id", ids);

    if (error) throw error;

    return NextResponse.json({ message: "Xóa thành công" });
  } catch (error: any) {
    console.error("Lỗi khi xóa:", error);
    return NextResponse.json(
      { error: error.message || "Không thể xóa dữ liệu" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    // Cập nhật một hoặc nhiều từ
    const { id, ids, english, vietnamese, ipa, example, collection, partOfSpeech, steps, target } = body;

    // --- Cập nhật hàng loạt (Batch update, ví dụ từ Toolbar) ---
    if (Array.isArray(ids) && ids.length > 0 && steps) {
      const newTarget = calculateNewTarget(steps); // Sử dụng hàm tính toán mới

      const { error } = await supabase
        .from("vocabularies")
        .update({ step: steps, target: newTarget })
        .in("id", ids);

      if (error) throw error;
      return NextResponse.json({ message: "Cập nhật hàng loạt thành công" });
    }

    // --- Cập nhật 1 từ (Ví dụ từ Flashcard) ---
    if (id && steps !== undefined) {
        const newTarget = calculateNewTarget(steps); // Sử dụng hàm tính toán mới

        // Cập nhật và yêu cầu Supabase trả về dữ liệu đã cập nhật
        const { data, error } = await supabase
            .from("vocabularies")
            .update({ step: steps, target: newTarget })
            .eq("id", id)
            .select() // Thêm .select() để lấy dữ liệu sau khi update
            .single(); // Lấy một object duy nhất

        if (error) throw error;
        
        // Map dữ liệu để khớp với định dạng frontend
        const updatedObject = {
            id: data.id,
            english: data.english,
            vietnamese: data.vietnamese,
            ipa: data.ipa,
            example: data.example,
            collection: data.collection,
            partOfSpeech: data.part_of_speech,
            target: data.target,
            steps: data.step,
        };
        
        // Trả về object đã cập nhật
        return NextResponse.json(updatedObject);
    }
    
    // --- Cập nhật 1 từ (Ví dụ từ Edit Modal) ---
    if (id) {
        const { error } = await supabase
          .from("vocabularies")
          .update({
            english,
            vietnamese,
            ipa,
            example,
            collection,
            part_of_speech: partOfSpeech,
            step: steps,
            target,
          })
          .eq("id", id);
          
        if (error) throw error;

        return NextResponse.json({ message: "Cập nhật thành công" });
    }

    return NextResponse.json({ error: "Yêu cầu cập nhật không hợp lệ" }, { status: 400 });

  } catch (error: any) {
    console.error("Lỗi khi cập nhật:", error);
    return NextResponse.json(
      { error: error.message || "Không thể cập nhật dữ liệu" },
      { status: 500 }
    );
  }
}

// POST: Thêm mới từ vựng
export async function POST(request: Request) {
  try {
    const { english, vietnamese, ipa, example, collection, partOfSpeech, steps, target } =
      await request.json();

    if (!english || !vietnamese) {
      return NextResponse.json(
        { error: "English và Vietnamese là bắt buộc" },
        { status: 400 }
      );
    }
    
    // Tính target ban đầu nếu không có target được cung cấp
    const initialStep = steps || "0";
    const initialTarget = target || calculateNewTarget(initialStep);


    const newVocabulary = {
      id: uuidv7(),
      english,
      vietnamese,
      ipa: ipa || "",
      example: example || "",
      collection: collection || "",
      part_of_speech: partOfSpeech || "",
      step: initialStep,
      target: initialTarget,
    };

    const { data, error } = await supabase
      .from("vocabularies")
      .insert(newVocabulary)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Lỗi khi thêm mới:", error);
    return NextResponse.json(
      { error: error.message || "Không thể thêm dữ liệu" },
      { status: 500 }
    );
  }
}