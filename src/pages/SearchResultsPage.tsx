import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import ProductCard from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
  const searchTerm = (searchParams.get("q") || "").trim();

  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [interspersedContent, setInterspersedContent] = useState<InterspersedContentSection[]>([]);

  // Fetch search products results
  useEffect(() => {
    if (searchTerm.length < MIN_SEARCH_LENGTH) {
      setSearchResults([]);
      setError(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    
    supabase
      .rpc("search_products", { search_term: searchTerm })
      .then(({ data, error }) => {
        if (error) {
          setError("Could not fetch search results.");
          setSearchResults([]);
        } else {
          setSearchResults((data as Product[]) || []);
        }
      })
      .catch((err) => {
        console.error('Search error:', err);
        setError("Could not fetch search results.");
        setSearchResults([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [searchTerm]);

  // Fetch interspersed (dynamic) content for "search_results_interspersed_content"
  useEffect(() => {
    supabase
      .from("home_content_sections")
      .select("*, section_items(*, products(*))")
      .eq("display_context", "search_results_interspersed_content")
      .order("display_order", { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          console.error('Error fetching interspersed content:', error);
          setInterspersedContent([]);
        } else {
          // Only keep sections with non-empty section_items
          setInterspersedContent((data || []).filter((section: InterspersedContentSection) =>
            Array.isArray(section.section_items) && section.section_items.length > 0
          ));
        }
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
    <div className="bg-gray-50 min-h-screen">
      {/* Header with back button */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="w-full max-w-screen-xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="p-2"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">Search Results</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="w-full max-w-screen-xl mx-auto py-8 px-4">
        {searchTerm.length >= MIN_SEARCH_LENGTH ? (
          <>
            <h2 className="text-lg font-semibold mb-5 text-gray-900">
              {isLoading
                ? <>Searching for <span className="font-bold text-green-700">{searchTerm}</span>...</>
                : `Results for "${searchTerm}"`
              }
            </h2>
            {isLoading ? (
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
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
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-1">
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
    </div>
  );
}

// Show only if section.section_items present and length > 0
function InterspersedContentBlock({ section }: { section: InterspersedContentSection }) {
  if (!section.section_items || !section.section_items.length) return null;
  // Simple renderer for the section for now; can expand as needed based on section_type
  return (
    <div className="bg-white shadow rounded-lg p-4 text-center">
      <div className="font-bold mb-2">{section.section_type} (Dynamic Block)</div>
      <div className="text-xs text-gray-500">Dynamic content: ID {section.id}</div>
      {/* Could use a real block component in future */}
    </div>
  );
}
