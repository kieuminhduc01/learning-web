import { Package } from "lucide-react";

export default function Header() {
  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 h-16 flex items-center">
        <Package className="w-8 h-8 text-blue-600 mr-3" />
        <h1 className="text-xl font-bold">Từ Vựng Của Thảo</h1>
      </div>
    </header>
  );
}