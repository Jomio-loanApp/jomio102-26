
import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

interface PageUIElement {
  id: string
  element_type: string
  display_context: string
  context_category_id?: string
  background_image_url?: string
  background_color_hex?: string
  banner_images_json?: any
}

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

interface SectionItem {
  id: string
  section_id: string
  item_type: string
  product_id?: string
  advertisement_image_url?: string
  advertisement_link_url?: string
  display_order_in_section: number
  products?: Product
}

interface HomeContentSection {
  id: string
  section_type: string
  title_text?: string
  display_context: string
  context_category_id?: string
  display_order: number
  see_more_link_url?: string
  grid_rows_for_random?: number
  section_items?: SectionItem[]
}

interface Category {
  category_id: string
  name: string
  image_url?: string
}

interface HomeState {
  selectedCategory: string | null
  headerBackground: PageUIElement | null
  bannerStrips: PageUIElement[]
  homeContentSections: HomeContentSection[]
  categories: Category[]
  categoryProducts: Product[]
  categoryProductsPage: number
  categoryProductsHasMore: boolean
  isLoading: boolean
  isLoadingCategoryProducts: boolean
  isHeaderSticky: boolean
  showHeaderText: boolean
  
  // Actions
  setSelectedCategory: (categoryId: string | null) => void
  setHeaderSticky: (sticky: boolean) => void
  setShowHeaderText: (show: boolean) => void
  fetchCategories: () => Promise<void>
  fetchHeaderBackground: (categoryId?: string | null) => Promise<void>
  fetchBannerStrips: (categoryId?: string | null) => Promise<void>
  fetchHomeContentSections: (categoryId?: string | null) => Promise<void>
  fetchCategoryProducts: (categoryId: string, page?: number) => Promise<void>
  loadMoreCategoryProducts: () => Promise<void>
}

const PRODUCTS_PER_PAGE = 12

export const useHomeStore = create<HomeState>((set, get) => ({
  selectedCategory: null,
  headerBackground: null,
  bannerStrips: [],
  homeContentSections: [],
  categories: [],
  categoryProducts: [],
  categoryProductsPage: 1,
  categoryProductsHasMore: true,
  isLoading: false,
  isLoadingCategoryProducts: false,
  isHeaderSticky: false,
  showHeaderText: true,

  setSelectedCategory: (categoryId) => {
    set({ 
      selectedCategory: categoryId,
      categoryProducts: [],
      categoryProductsPage: 1,
      categoryProductsHasMore: true
    })
    const { fetchHeaderBackground, fetchBannerStrips, fetchHomeContentSections, fetchCategoryProducts } = get()
    fetchHeaderBackground(categoryId)
    fetchBannerStrips(categoryId)
    fetchHomeContentSections(categoryId)
    if (categoryId) {
      fetchCategoryProducts(categoryId, 1)
    }
  },

  setHeaderSticky: (sticky) => set({ isHeaderSticky: sticky }),
  setShowHeaderText: (show) => set({ showHeaderText: show }),

  fetchCategories: async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('category_id, name, image_url')
        .order('name')

      if (error) throw error
      set({ categories: data || [] })
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  },

  fetchHeaderBackground: async (categoryId = null) => {
    try {
      let query = supabase
        .from('page_ui_elements')
        .select('*')
        .eq('element_type', 'header_background')

      if (categoryId) {
        query = query
          .eq('display_context', 'category_page_header')
          .eq('context_category_id', categoryId)
      } else {
        query = query.eq('display_context', 'default_home_header')
      }

      const { data, error } = await query.single()

      if (error && error.code !== 'PGRST116') throw error
      set({ headerBackground: data })
    } catch (error) {
      console.error('Error fetching header background:', error)
    }
  },

  fetchBannerStrips: async (categoryId = null) => {
    try {
      let query = supabase
        .from('page_ui_elements')
        .select('*')
        .eq('element_type', 'category_banner_strip')

      if (categoryId) {
        query = query
          .eq('display_context', 'category_page_banners')
          .eq('context_category_id', categoryId)
      } else {
        query = query.eq('display_context', 'default_home_banners')
      }

      const { data, error } = await query

      if (error) throw error
      set({ bannerStrips: data || [] })
    } catch (error) {
      console.error('Error fetching banner strips:', error)
    }
  },

  fetchHomeContentSections: async (categoryId = null) => {
    try {
      set({ isLoading: true })
      let query = supabase
        .from('home_content_sections')
        .select(`
          *,
          section_items (
            *,
            products ( product_id, name, image_url, price_string, numeric_price, availability_status, is_active, unit_type, category_id )
          )
        `)

      if (categoryId) {
        query = query
          .eq('display_context', 'category_page_ordered_content')
          .eq('context_category_id', categoryId)
      } else {
        query = query.in('display_context', ['home_all_initial_content', 'home_all_sequential_category_content'])
      }

      const { data, error } = await query
        .order('display_order')
        .order('display_order_in_section', { foreignTable: 'section_items' })

      if (error) throw error
      
      // Process sections with random category grids
      const processedSections = await Promise.all((data || []).map(async (section) => {
        if (section.section_type === 'random_category_grid_3xN' && section.context_category_id) {
          const rowCount = section.grid_rows_for_random || 3
          const productCount = 3 * rowCount

          try {
            const { data: randomProducts, error: randomError } = await supabase
              .from('products')
              .select('*')
              .eq('category_id', section.context_category_id)
              .eq('is_active', true)
              .neq('availability_status', 'Out of Stock')
              .limit(productCount * 2)

            if (randomError) throw randomError
            
            const shuffled = (randomProducts || []).sort(() => 0.5 - Math.random())
            const selectedProducts = shuffled.slice(0, productCount)
            
            // Convert to section_items format
            section.section_items = selectedProducts.map((product, index) => ({
              id: `random_${section.id}_${index}`,
              section_id: section.id,
              item_type: 'product',
              product_id: product.product_id,
              display_order_in_section: index,
              products: product
            }))
          } catch (error) {
            console.error('Error fetching random products:', error)
            section.section_items = []
          }
        }
        return section
      }))
      
      set({ homeContentSections: processedSections })
    } catch (error) {
      console.error('Error fetching home content sections:', error)
    } finally {
      set({ isLoading: false })
    }
  },

  fetchCategoryProducts: async (categoryId, page = 1) => {
    try {
      set({ isLoadingCategoryProducts: true })
      
      const from = (page - 1) * PRODUCTS_PER_PAGE
      const to = from + PRODUCTS_PER_PAGE - 1

      const { data, error, count } = await supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .neq('availability_status', 'Out of Stock')
        .range(from, to)
        .order('name')

      if (error) throw error
      
      const products = data || []
      const hasMore = (count || 0) > to + 1

      if (page === 1) {
        set({ 
          categoryProducts: products,
          categoryProductsPage: 1,
          categoryProductsHasMore: hasMore
        })
      } else {
        set(state => ({ 
          categoryProducts: [...state.categoryProducts, ...products],
          categoryProductsPage: page,
          categoryProductsHasMore: hasMore
        }))
      }
    } catch (error) {
      console.error('Error fetching category products:', error)
    } finally {
      set({ isLoadingCategoryProducts: false })
    }
  },

  loadMoreCategoryProducts: async () => {
    const { selectedCategory, categoryProductsPage, categoryProductsHasMore, fetchCategoryProducts } = get()
    if (selectedCategory && categoryProductsHasMore) {
      await fetchCategoryProducts(selectedCategory, categoryProductsPage + 1)
    }
  }
}))
