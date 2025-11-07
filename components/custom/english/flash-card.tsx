// src/components/custom/english/FlashcardModal.tsx

"use client";

import { useState, useMemo, ReactNode, useEffect } from "react"; 
import dayjs from "dayjs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, RotateCw, Check, Clock, ChevronDown } from "lucide-react"; 
import { Switch } from "@/components/ui/switch"; 
import { Label } from "@/components/ui/label";

// Thêm các component DropdownMenu
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel 
} from "@/components/ui/dropdown-menu";


interface Vocabulary {
  id: string;
  english: string;
  vietnamese: string;
  ipa: string;
  example: string;
  collection: string;
  partOfSpeech: string;
  target: string;
  steps: string;
}

interface FlashcardModalProps {
  vocabularies: Vocabulary[];
  children: ReactNode;
  disabled: boolean;
  onUpdateStep: () => Promise<void>; 
}

// Các lựa chọn Step theo yêu cầu của bạn
const FLASHCARD_STEP_OPTIONS = [
    { label: "Quên", step: "0", variant: "destructive" as const },
    { label: "Mới Học", step: "1", variant: "secondary" as const },
    { label: "Cần Cố", step: "2", variant: "outline" as const },
    { label: "Khó", step: "3-6", variant: "outline" as const },
    { label: "Ổn", step: "7-15", variant: "default" as const },
    { label: "Dễ", step: "16-30", variant: "default" as const },
    { label: "Rất Dễ", step: "30-50", variant: "default" as const },
    { label: "Xong", step: "0-50", variant: "default" as const },
];

// Component Flashcard
const Flashcard: React.FC<{ 
    vocabulary: Vocabulary, 
    isEnglishFront: boolean,
    isFlipped: boolean, 
    flipCard: () => void, 
    isUpdating: boolean
}> = ({ vocabulary, isEnglishFront, isFlipped, flipCard, isUpdating }) => {

  // MẶT 1 (English Content)
  const EnglishContent = (
    <div className="flex flex-col items-center p-8 text-center h-full">
      <h2 className="text-6xl font-extrabold text-blue-700 select-none break-words max-w-full">
        {vocabulary.english}
      </h2>
      <p className="text-2xl font-mono text-gray-600 mt-4 select-none">
        /{vocabulary.ipa || "—"}/
      </p>
      <div className="mt-8 pt-4 border-t w-full">
        <p className="text-lg italic text-gray-800 break-words whitespace-normal select-none">
          <span className="font-semibold text-gray-500">Example:</span> {vocabulary.example || "Không có ví dụ"}
        </p>
      </div>
    </div>
  );

  // MẶT 2 (Vietnamese Content)
  const VietnameseContent = (
    <div className="flex flex-col p-8 h-full space-y-4">
      <h3 className="text-4xl font-bold text-green-700 border-b pb-2 mb-2 select-none break-words max-w-full">
        {vocabulary.vietnamese}
      </h3>
      <p className="text-xl font-semibold text-purple-700 select-none">
        <span className="font-normal text-gray-500">Part of Speech:</span> {vocabulary.partOfSpeech || "—"}
      </p>

      <div className="flex-1">
        {/* Nội dung trống hoặc có thể thêm ghi chú nếu cần */}
      </div>

      <div className="mt-auto pt-4 border-t text-base text-gray-600 flex justify-between select-none">
        <span className="font-medium bg-yellow-100 px-3 py-1 rounded-full">
          Collection: {vocabulary.collection || "—"}
        </span>
        <div className="space-x-4">
            <span>
              Step: <strong className="text-lg text-red-600">{vocabulary.steps || "0"}</strong>
            </span>
            <span>
                Target: <strong className="text-lg text-red-600">{vocabulary.target ? dayjs(vocabulary.target).format("YYYY-MM-DD") : "—"}</strong>
            </span>
        </div>
      </div>
    </div>
  );
  
  // Xác định nội dung Mặt trước và Mặt sau dựa trên isEnglishFront
  const FrontContent = isEnglishFront ? EnglishContent : VietnameseContent;
  const BackContent = isEnglishFront ? VietnameseContent : EnglishContent;
  const FrontLabel = isEnglishFront ? "English" : "Vietnamese";

  return (
    <div className="flex flex-col items-center w-full">
      <div
        className="w-full max-w-3xl h-96 bg-white border-4 border-blue-500 rounded-xl shadow-2xl cursor-pointer relative perspective-1000"
        onClick={flipCard}
      >
        <div
          className={`relative w-full h-full transform-style-3d transition-transform duration-700 ${
            isFlipped ? "rotate-y-180" : ""
          }`}
        >
          {/* Front Face (Mặt hiện ra đầu tiên) */}
          <div className="absolute w-full h-full backface-hidden flex items-center justify-center p-4">
            {FrontContent}
          </div>
          {/* Back Face (Mặt bị ẩn) */}
          <div className="absolute w-full h-full backface-hidden transform rotate-y-180 flex items-center justify-center p-4">
            {BackContent}
          </div>
        </div>
      </div>
      
      {/* Nút lật card */}
      <Button
        onClick={(e) => {
          e.stopPropagation(); 
          flipCard();
        }}
        variant="outline"
        className="mt-4"
        size="sm"
        disabled={isUpdating}
      >
        <RotateCw className="w-4 h-4 mr-2" />
        {isFlipped ? `Quay lại mặt trước (${FrontLabel})` : `Xem mặt sau`}
      </Button>
    </div>
  );
};


const FlashcardModal: React.FC<FlashcardModalProps> = ({
  vocabularies,
  children,
  disabled,
  onUpdateStep,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false); 
  const [isUpdating, setIsUpdating] = useState(false); 
  const [localVocabularies, setLocalVocabularies] = useState<Vocabulary[]>([]);
  const [isEnglishFront, setIsEnglishFront] = useState(true); 

  // Đồng bộ hóa danh sách từ vựng khi prop thay đổi hoặc modal mở
  useEffect(() => {
    if (isOpen) {
        setLocalVocabularies(vocabularies);
        setCurrentIndex(0);
        setIsFlipped(false); 
    }
  }, [vocabularies, isOpen]);
  
  // Reset index khi danh sách từ thay đổi
  useMemo(() => {
    if (isOpen) {
        setCurrentIndex(0);
        setIsFlipped(false); 
    }
  }, [vocabularies.length, isOpen]);
  
  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % localVocabularies.length);
    setIsFlipped(false); // Reset lật thẻ khi chuyển sang thẻ mới
  };

  const goToPrev = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? localVocabularies.length - 1 : prev - 1
    );
    setIsFlipped(false); // Reset lật thẻ khi chuyển sang thẻ mới
  };
  
  const flipCard = () => setIsFlipped((prev) => !prev);
  
  const updateVocabularyStep = async (stepValue: string, id: string) => {
    setIsUpdating(true); // Bắt đầu cập nhật
    try {
        const res = await fetch("/api/vocabularies", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, steps: stepValue }), 
        });
        
        if (res.ok) {
            const updatedVocab = await res.json() as Vocabulary;
            
            // 1. Cập nhật state cục bộ để hiển thị Target/Step mới ngay lập tức
            setLocalVocabularies(prevVocabs =>
                prevVocabs.map(v => (v.id === id ? updatedVocab : v))
            );

            // 2. GIỮ NGUYÊN TRẠNG THÁI LẬT (YÊU CẦU NGƯỜI DÙNG)

            // 3. Gọi hàm refresh dữ liệu gốc (để cập nhật bảng chính)
            await onUpdateStep(); 

        } else {
            throw new Error("Cập nhật thất bại!");
        }
    } catch (error) {
        console.error("Lỗi khi cập nhật Step:", error);
        alert("Không thể cập nhật Step. Vui lòng thử lại!");
    } finally {
        setIsUpdating(false); // Kết thúc cập nhật
    }
  };


  const currentVocabulary = localVocabularies[currentIndex];
  const totalCards = localVocabularies.length;

  if (totalCards === 0 && !disabled && isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[950px] max-w-[95%] p-4 sm:p-6 h-[90vh] flex flex-col">
        
        {/* SỬA: DialogHeader chỉ chứa tiêu đề, nút đóng mặc định sẽ nằm ở góc trên bên phải */}
        <DialogHeader className="p-0">
          <DialogTitle className="text-xl">
            Flashcards
          </DialogTitle>
        </DialogHeader>

        {/* THÊM: Khu vực mới cho vị trí thẻ và tùy chọn mặt trước */}
        <div className="flex items-center justify-between mt-2 mb-4 p-0"> 
            {/* Vị trí thẻ hiện tại */}
            <span className="text-lg font-medium text-gray-700">
                Thẻ: {currentIndex + 1} / {totalCards}
            </span>

            {/* Lựa chọn mặt trước - Đã di chuyển ra khỏi DialogHeader */}
            <div className="flex items-center space-x-2">
                <Label htmlFor="flashcard-side" className="text-sm font-normal text-gray-500 select-none">
                    Mặt trước: <strong className="font-semibold text-blue-600">{isEnglishFront ? "English" : "Vietnamese"}</strong>
                </Label>
                <Switch
                    id="flashcard-side"
                    checked={isEnglishFront}
                    onCheckedChange={setIsEnglishFront}
                    disabled={isUpdating}
                />
            </div>
        </div>
        
        {currentVocabulary ? (
          <div className="flex-1 flex flex-col justify-center items-center w-full">
            {/* Flashcard Component */}
            <Flashcard 
                key={currentVocabulary.id} 
                vocabulary={currentVocabulary} 
                isEnglishFront={isEnglishFront} 
                isFlipped={isFlipped}
                flipCard={flipCard}
                isUpdating={isUpdating}
            />

            {/* Step Selection (DROPDOWN REPLACEMENT) - LUÔN HIỂN THỊ */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button 
                        variant="default" 
                        size="lg" 
                        className="mt-6 w-[200px]"
                        // Dropdown luôn hiển thị, nhưng nút bị disabled nếu chưa lật thẻ
                    >
                        {isUpdating ? (
                            <>
                                <Clock className="w-4 h-4 animate-spin mr-2" />
                                Đang Lưu Step...
                            </>
                        ) : (
                            <>
                                <Check className="w-5 h-5 mr-2" />
                                {/* Thay đổi text để nhắc nhở người dùng lật thẻ nếu cần */}
                                Chọn Step Mới
                                <ChevronDown className="w-4 h-4 ml-2" />
                            </>
                        )}
                    </Button>
                </DropdownMenuTrigger>
                {/* Content chỉ hiển thị khi DropdownMenuTrigger không bị disabled */}
                {!isUpdating && (
                  <DropdownMenuContent className="w-56" align="center">
                      <DropdownMenuLabel>Đánh giá độ khó (Target: Ngày)</DropdownMenuLabel>
                      {FLASHCARD_STEP_OPTIONS.map((option) => (
                          <DropdownMenuItem
                              key={option.step}
                              onClick={() => updateVocabularyStep(option.step, currentVocabulary.id)}
                              className={`cursor-pointer ${option.variant === 'destructive' ? 'text-red-600 focus:bg-red-50' : ''}`}
                              disabled={isUpdating}
                          >
                              <div className="flex justify-between w-full items-center">
                                  <span>{option.label}</span>
                                  <span className="text-xs opacity-70">({option.step} ngày)</span>
                              </div>
                          </DropdownMenuItem>
                      ))}
                  </DropdownMenuContent>
                )}
            </DropdownMenu>

            {/* Navigation Controls */}
            <div className={`flex gap-4 mt-4`}>
              <Button
                onClick={goToPrev}
                variant="secondary"
                size="icon"
                aria-label="Previous Card"
                disabled={totalCards <= 1 || isUpdating}
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <Button
                onClick={goToNext}
                variant="secondary"
                size="icon"
                aria-label="Next Card"
                disabled={totalCards <= 1 || isUpdating}
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Vui lòng chọn từ vựng để tạo flashcard.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FlashcardModal;