"use client";

import dayjs from "dayjs";
import "@/utils/random";
import "@/utils/time";
import { useState } from "react";

export const Flashcard: React.FC<{
  vocabulary: Vocabulary,
  isEnglishFront: boolean,
}> = ({ vocabulary, isEnglishFront }) => {
  const [isFlipped, setIsFlipped] = useState(false);
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

  const VietnameseContent = (
    <div className="flex flex-col p-8 h-full space-y-4">
      <h3 className="text-4xl font-bold text-green-700 border-b pb-2 mb-2 select-none break-words max-w-full">
        {vocabulary.vietnamese}
      </h3>
      <p className="text-xl font-semibold text-purple-700 select-none">
        <span className="font-normal text-gray-500">Part of Speech:</span> {vocabulary.partOfSpeech || "—"}
      </p>

      <div className="flex-1">
      </div>

      <div className="mt-auto pt-4 border-t text-base text-gray-600 flex justify-between select-none">
        <span className="font-medium bg-yellow-100 px-3 py-1 rounded-full">
          Collection: {vocabulary.collection || "—"}
        </span>
        <div className="space-x-4">
          <span>
            Step: <strong className="text-lg text-red-600">{vocabulary.step || "0"}</strong>
          </span>
          <span>
            Target: <strong className="text-lg text-red-600">{vocabulary.target ? dayjs(vocabulary.target).format("YYYY-MM-DD") : "—"}</strong>
          </span>
        </div>
      </div>
    </div>
  );

  const FrontContent = isEnglishFront ? EnglishContent : VietnameseContent;
  const BackContent = isEnglishFront ? VietnameseContent : EnglishContent;

  const flipCard = () => {
    setIsFlipped((prev) => !prev);
  }
  return (
    <div className="flex flex-col items-center w-full">
      <div
        className="w-full max-w-3xl h-96 bg-white border-4 border-blue-500 rounded-xl shadow-2xl cursor-pointer relative perspective-1000"
        onClick={flipCard}
      >
        <div
          className={`relative w-full h-full transform-style-3d transition-transform duration-700 ${isFlipped ? "rotate-y-180" : ""
            }`}
        >
          <div className="absolute w-full h-full backface-hidden flex items-center justify-center p-4">
            {FrontContent}
          </div>
          <div className="absolute w-full h-full backface-hidden transform rotate-y-180 flex items-center justify-center p-4">
            {BackContent}
          </div>
        </div>
      </div>
    </div>
  );
};


