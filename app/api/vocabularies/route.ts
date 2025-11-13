import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { v7 as uuidv7 } from 'uuid';
import dayjs from 'dayjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function calculateNewTarget(step: string): string {
  const today = dayjs().startOf('day');
  let daysToAdd = 0;

  const parts = step.split('-');

  if (parts.length === 1) {
    // Xử lý các step là số đơn: "0", "1", "2"
    daysToAdd = parseInt(step, 10);
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
    step: item.step,
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

    const { id, ids, english, vietnamese, ipa, example, collection, partOfSpeech, step } = body;

    const newTarget = calculateNewTarget(step);

    if (Array.isArray(ids) && ids.length > 0 && step) {

      const { error, data } = await supabase
        .from("vocabularies")
        .update({ step, target: newTarget })
        .in("id", ids);

      if (error) throw error;
      console.log("Updated data:", data);
      return NextResponse.json(data);
    }

    if (id) {
      const { error, data } = await supabase
        .from("vocabularies")
        .update({
          english,
          vietnamese,
          ipa,
          example,
          collection,
          part_of_speech: partOfSpeech,
          step,
          target: newTarget,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json(data);
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

export async function POST(request: Request) {
  try {
    const { english, vietnamese, ipa, example, collection, partOfSpeech, step, target } =
      await request.json();

    if (!english || !vietnamese) {
      return NextResponse.json(
        { error: "English và Vietnamese là bắt buộc" },
        { status: 400 }
      );
    }

    const initialStep = step || "0";
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