
import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useDebounce } from "@/hooks/useDebounce";
import ProductCard from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";

interface Product {
  product_id: string
  name: string
  description?: string
  price_string: string
  numeric_price: number
  unit_type: string
  image_url?: string
  category_id?: string
  is_active: boolean
  availability_status: string
}

export interface InterspersedContentSection {
  id: string
  section_type: string
  display_context: string
  display_order: number
  section_items: any[]
}

const PRODUCT_CHUNK = 6;
const MIN_SEARCH_LENGTH = 2;

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const searchTerm = (searchParams.get("q") || "").trim();
  const debouncedSearchTerm = useDebounce(searchTerm, 400);

  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [interspersedContent, setInterspersedContent] = useState<InterspersedContentSection[]>([]);

  // Fetch search products results
  useEffect(() => {
    if (debouncedSearchTerm.length < MIN_SEARCH_LENGTH) {
      setSearchResults([]);
      setError(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    supabase
      .rpc("search_products", { search_term: debouncedSearchTerm })
      .then(({ data, error }) => {
        if (error) {
          setError("Could not fetch search results.");
          setSearchResults([]);
        } else {
          setSearchResults((data as Product[]) || []);
        }
        setIsLoading(false);
      });
  }, [debouncedSearchTerm]);

  // Fetch interspersed content for "search_results_interspersed_content"
  useEffect(() => {
    supabase
      .from("home_content_sections")
      .select("*, section_items(*, products(*))")
      .eq("display_context", "search_results_interspersed_content")
      .order("display_order", { ascending: true })
      .then(({ data }) => {
        setInterspersedContent(data || []);
      });
  }, []);

  // Merge logic: intersperse content after every 6 products (can tune dynamically)
  const mergedResults = useMemo(() => {
    const merged: Array<Product | { interspersedContent: InterspersedContentSection }> = [];
    let productIdx = 0;
    let contentIdx = 0;

    while (productIdx < searchResults.length || contentIdx < interspersedContent.length) {
      // Add up to PRODUCT_CHUNK products
      for (let i = 0; i < PRODUCT_CHUNK && productIdx < searchResults.length; ++i, ++productIdx) {
        merged.push(searchResults[productIdx]);
      }
      // Add content block, if available and content remains
      if (contentIdx < interspersedContent.length) {
        merged.push({ interspersedContent: interspersedContent[contentIdx] });
        ++contentIdx;
      }
    }
    return merged;
  }, [searchResults, interspersedContent]);

  return (
    <div className="bg-gray-50 min-h-screen py-8 px-2 sm:px-4 max-w-7xl mx-auto">
      {searchTerm.length >= MIN_SEARCH_LENGTH ? (
        <>
          <h2 className="text-lg font-semibold mb-5 text-gray-900">
            {isLoading
              ? <>Searching for <span className="font-bold text-green-700">{searchTerm}</span>...</>
              : `Results for "${searchTerm}"`
            }
          </h2>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[...Array(PRODUCT_CHUNK)].map((_, i) => (
                <div key={i} className="h-52"><Skeleton className="w-full h-full" /></div>
              ))}
            </div>
          ) : error ? (
            <div className="text-red-600 font-medium mt-8 text-center">{error}</div>
          ) : searchResults.length === 0 ? (
            <div className="mt-8 text-center">
              <div className="text-lg font-semibold mb-2">
                No results found for "<span className="text-green-800">{searchTerm}</span>"
              </div>
              <div className="text-gray-500">Check your spelling or try a different term.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-1">
              {mergedResults.map((item, idx) =>
                "interspersedContent" in item ? (
                  <div
                    key={`content-${idx}`}
                    className="col-span-full mb-4"
                  >
                    {/* Interspersed Content block rendering */}
                    <InterspersedContentBlock section={item.interspersedContent} />
                  </div>
                ) : (
                  <ProductCard
                    key={item.product_id}
                    product={item}
                    onQuickView={() => {}} // Optionally wire to modal if needed
                  />
                )
              )}
            </div>
          )}
        </>
      ) : (
        <div className="text-gray-400 text-center py-12 text-lg">
          Search for your favorite products...
        </div>
      )}
    </div>
  );
}

// Dummy; swap with real dynamic renderer as needed
function InterspersedContentBlock({ section }: { section: InterspersedContentSection }) {
  // Simple renderer for the section for now; can expand as needed based on section_type
  return (
    <div className="bg-white shadow rounded-lg p-4 text-center">
      <div className="font-bold mb-2">{section.section_type} (Dynamic Block)</div>
      <div className="text-xs text-gray-500">Dynamic content: ID {section.id}</div>
      {/* Could use a real block component in future */}
    </div>
  );
}
