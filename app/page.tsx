"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import dayjs from "dayjs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Search,
  BookOpen, // Thêm icon cho Flashcard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import AddUpdateVocabularyModal from "@/src/domains/english/components/add-update";
import FlashcardModal from "@/src/domains/english/components/flash-card";
import { addDays } from "@/utils/time";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100, "all"] as const;
type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];
const MAX_VISIBLE_PAGES = 5;
const STEP_OPTIONS = ["0", "1", "2", "3-6", "7-15", "16-30", "30-50", "0-50"];

export default function Home() {
  const [vocabularies, setVocabularies] = useState<Vocabulary[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [batchStep, setBatchStep] = useState<string>("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim().toLowerCase());
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const fetchVocabularies = async () => {
    console.log("Fetching vocabularies...");
    setLoading(true);
    try {
      const res = await fetch("/api/vocabularies");
      const data = await res.json();
      setVocabularies(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVocabularies();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    setSelected([]);
  }, [pageSize, debouncedSearch, activeTab]);

  const today = new Date();

  const filteredVocabularies = useMemo(() => {
    let data = vocabularies;
    if (activeTab === "due") {
      data = vocabularies.filter(
        (v) => v.target && dayjs(v.target).isBefore(addDays(today,1), "day")
      );
    }
    if (!debouncedSearch) return data;
    return data.filter((v) => {
      const targetDate = v.target ? dayjs(v.target).format("YYYY-MM-DD") : "";
      const combined = [
        v.english,
        v.vietnamese,
        v.ipa,
        v.example,
        v.collection,
        v.partOfSpeech,
        targetDate,
        v.step,
      ]
        .join(" ")
        .toLowerCase();
      return combined.includes(debouncedSearch);
    });
  }, [vocabularies, debouncedSearch, activeTab]);

  // Lọc danh sách từ vựng đã chọn để truyền vào FlashcardModal
  const selectedVocabularies = useMemo(() => {
    return vocabularies.filter((v) => selected.includes(v.id));
  }, [vocabularies, selected]);


  const effectivePageSize =
    pageSize === "all" ? filteredVocabularies.length : Number(pageSize);
  const totalPages = Math.ceil(filteredVocabularies.length / effectivePageSize);
  const startIndex = (currentPage - 1) * effectivePageSize;
  const endIndex = Math.min(
    startIndex + effectivePageSize,
    filteredVocabularies.length
  );
  const currentData = filteredVocabularies.slice(startIndex, endIndex);

  const toggleAll = () => {
    if (selected.length === currentData.length) {
      setSelected([]);
    } else {
      setSelected(currentData.map((v) => v.id));
    }
  };

  const toggleRow = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getVisiblePages = () => {
    const half = Math.floor(MAX_VISIBLE_PAGES / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, currentPage + half);
    if (currentPage <= half) {
      end = Math.min(totalPages, MAX_VISIBLE_PAGES);
    } else if (currentPage > totalPages - half) {
      start = Math.max(1, totalPages - MAX_VISIBLE_PAGES + 1);
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const visiblePages = getVisiblePages();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch("/api/vocabularies", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selected }),
      });

      if (!res.ok) {
        throw new Error("Lỗi khi xóa từ vựng!");
      }

      setVocabularies((prev) => prev.filter((v) => !selected.includes(v.id)));
      setSelected([]);
      setOpenDeleteModal(false);
    } catch (error) {
      console.error(error);
      alert("Không thể xóa từ vựng. Vui lòng thử lại!");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBatchUpdate = async () => {
    if (!batchStep || selected.length === 0) return;
    await fetch("/api/vocabularies", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selected, step: batchStep }),
    });
    setBatchStep("");
    await fetchVocabularies();
    setSelected([]); // Clear selection after batch update
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Đang tải từ vựng...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex gap-2 mb-4">
          <TabsTrigger value="all">Tất cả từ vựng</TabsTrigger>
          <TabsTrigger value="due">Cần ôn hôm nay</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:w-1/2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Tìm kiếm theo bất kỳ trường nào..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              {/* Nút xem Flashcards */}
              <FlashcardModal
                vocabularies={selectedVocabularies}
                disabled={selected.length === 0}
                onUpdateStep={async () => {
                }}
                onClose={fetchVocabularies}
              >
                <Button
                  variant="outline"
                  size="sm"
                  disabled={selected.length === 0}
                  className="flex items-center gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  Xem Flashcards ({selected.length})
                </Button>
              </FlashcardModal>

              <AddUpdateVocabularyModal
                onUpdate={async () => {
                  await fetchVocabularies();
                }}
              />

              {/* Nút xóa từ */}
              <AlertDialog
                open={openDeleteModal}
                onOpenChange={setOpenDeleteModal}
              >
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={selected.length === 0}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Xóa từ vựng
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                    <AlertDialogDescription>
                      Bạn có chắc muốn xóa{" "}
                      <strong>{selected.length}</strong> từ vựng đã chọn không?
                      Hành động này không thể hoàn tác.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {isDeleting ? "Đang xóa..." : "Xóa"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {/* Cập nhật step hàng loạt */}
              <div className="flex items-center gap-2">
                <Select
                  value={batchStep}
                  onValueChange={(val) => setBatchStep(val)}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Chọn Step" />
                  </SelectTrigger>
                  <SelectContent>
                    {STEP_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={selected.length === 0 || !batchStep}
                  onClick={handleBatchUpdate}
                >
                  Cập nhật Step
                </Button>
              </div>
            </div>

            <span className="text-sm text-gray-600">
              Đã chọn: <strong>{selected.length}</strong> / {currentData.length}{" "}
              {totalPages > 1 && `(trang ${currentPage}/${totalPages})`}
            </span>
          </div>

          {/* Bảng từ vựng */}
          <div className="rounded-md border overflow-hidden max-h-[600px] overflow-y-auto">
            <Table className="table-fixed w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">
                    <Checkbox
                      checked={
                        selected.length === currentData.length &&
                        currentData.length > 0
                      }
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead className="w-[150px] text-left">English</TableHead>
                  <TableHead className="w-[200px] text-left">Vietnamese</TableHead>
                  <TableHead className="w-[120px] text-center">IPA</TableHead>
                  <TableHead className="w-[250px] text-left">Example</TableHead>
                  <TableHead className="w-[150px] text-center">Collection</TableHead>
                  <TableHead className="w-[150px] text-center">Part of Speech</TableHead>
                  <TableHead className="w-[120px] text-center">Target</TableHead>
                  <TableHead className="w-[80px] text-center">Step</TableHead>
                  <TableHead className="w-[80px] text-center">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {currentData.length > 0 ? (
                  currentData.map((v, index) => (
                    <TableRow
                      key={v.id}
                      className={`transition-colors duration-150 ${index % 2 === 0
                        ? "bg-white hover:bg-gray-100"
                        : "bg-gray-50 hover:bg-gray-100"
                        }`}
                    >
                      <TableCell className="w-12 text-center">
                        <Checkbox
                          checked={selected.includes(v.id)}
                          onCheckedChange={() => toggleRow(v.id)}
                        />
                      </TableCell>
                      <TableCell className="w-[150px] text-left font-semibold text-blue-600 break-words whitespace-normal">
                        {v.english}
                      </TableCell>
                      <TableCell className="w-[200px] text-left break-words whitespace-normal">
                        {v.vietnamese}
                      </TableCell>
                      <TableCell className="w-[120px] text-center font-mono text-xs text-gray-600">
                        /{v.ipa ? v.ipa : "-"}/
                      </TableCell>
                      <TableCell className="w-[250px] text-left text-sm italic break-words whitespace-normal">
                        {v.example}
                      </TableCell>
                      <TableCell className="w-[150px] text-center">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                          {v.collection?v.collection:"-"}
                        </span>
                      </TableCell>
                      <TableCell className="w-[150px] text-center text-xs">
                        {v.partOfSpeech? v.partOfSpeech : "-"}
                      </TableCell>
                      <TableCell className="w-[120px] text-center">
                        {v.target ? dayjs(v.target).format("YYYY-MM-DD") : "-"}
                      </TableCell>
                      <TableCell className="w-[80px] text-center font-mono text-xs">
                        {v.step? v.step : "-"}
                      </TableCell>
                      <TableCell className="w-[80px] text-center">
                        <AddUpdateVocabularyModal
                          vocabulary={v}
                          onUpdate={async () => {
                            await fetchVocabularies();
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-6 text-gray-500">
                      Không có dữ liệu.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Phân trang */}
          {filteredVocabularies.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">Hiển thị</span>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => setPageSize(value as PageSize)}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option.toString()}>
                        {option === "all" ? "Tất cả" : option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-gray-600">dòng</span>
              </div>

              <div className="text-sm text-gray-600">
                Hiển thị {startIndex + 1}–{endIndex} trong {filteredVocabularies.length} từ
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>

                  {visiblePages.map((page, index) => (
                    <div key={page}>
                      {index > 0 &&
                        visiblePages[index - 1] !== page - 1 && (
                          <span className="px-2 text-gray-500">...</span>
                        )}
                      <Button
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToPage(page)}
                        className="w-8"
                      >
                        {page}
                      </Button>
                    </div>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}