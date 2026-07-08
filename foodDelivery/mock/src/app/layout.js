import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";

export const metadata = {
  title: "mock - Premium Food Delivery",
  description: "Swiggy & Zomato style high fidelity premium food delivery app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex justify-center bg-[#050608]">
        <AuthProvider>
          <CartProvider>
            <div className="app-container">
              <Header />
              <main className="flex-1 w-full flex flex-col overflow-y-auto">
                {children}
              </main>
              <BottomNav />
            </div>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
