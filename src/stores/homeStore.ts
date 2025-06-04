
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

interface HomeContentSection {
  id: string
  section_type: string
  title_text?: string
  display_context: string
  context_category_id?: string
  display_order: number
  see_more_link_url?: string
  grid_rows_for_random?: number
}

interface SectionItem {
  id: string
  section_id: string
  item_type: string
  product_id?: string
  advertisement_image_url?: string
  advertisement_link_url?: string
  display_order: number
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
  sectionItems: { [sectionId: string]: SectionItem[] }
  categories: Category[]
  isLoading: boolean
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
  fetchSectionItems: (sectionId: string) => Promise<void>
}

export const useHomeStore = create<HomeState>((set, get) => ({
  selectedCategory: null,
  headerBackground: null,
  bannerStrips: [],
  homeContentSections: [],
  sectionItems: {},
  categories: [],
  isLoading: false,
  isHeaderSticky: false,
  showHeaderText: true,

  setSelectedCategory: (categoryId) => {
    set({ selectedCategory: categoryId })
    const { fetchHeaderBackground, fetchBannerStrips, fetchHomeContentSections } = get()
    fetchHeaderBackground(categoryId)
    fetchBannerStrips(categoryId)
    fetchHomeContentSections(categoryId)
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
        .select('*')

      if (categoryId) {
        query = query
          .eq('display_context', 'category_page_ordered_content')
          .eq('context_category_id', categoryId)
      } else {
        query = query.in('display_context', ['home_all_initial_content', 'home_all_sequential_category_content'])
      }

      const { data, error } = await query.order('display_order')

      if (error) throw error
      
      const sections = data || []
      set({ homeContentSections: sections })

      // Fetch items for each section
      for (const section of sections) {
        get().fetchSectionItems(section.id)
      }
    } catch (error) {
      console.error('Error fetching home content sections:', error)
    } finally {
      set({ isLoading: false })
    }
  },

  fetchSectionItems: async (sectionId) => {
    try {
      const { data, error } = await supabase
        .from('section_items')
        .select('*')
        .eq('section_id', sectionId)
        .order('display_order')

      if (error) throw error
      
      set(state => ({
        sectionItems: {
          ...state.sectionItems,
          [sectionId]: data || []
        }
      }))
    } catch (error) {
      console.error('Error fetching section items:', error)
    }
  }
}))
