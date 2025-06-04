
import { useHomeStore } from '@/stores/homeStore'

const BannerStrip = () => {
  const { bannerStrips } = useHomeStore()

  if (!bannerStrips.length) return null

  return (
    <div className="px-4 py-2">
      {bannerStrips.map((banner) => {
        const bannerImages = banner.banner_images_json || []
        
        if (!bannerImages.length) return null

        return (
          <div key={banner.id} className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-3 min-w-max">
              {bannerImages.map((image: any, index: number) => (
                <div 
                  key={index}
                  className="flex-shrink-0 w-80 h-24 rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-200"
                  onClick={() => {
                    if (image.link_url) {
                      window.open(image.link_url, '_blank')
                    }
                  }}
                >
                  <img
                    src={image.image_url}
                    alt={image.alt_text || 'Banner'}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default BannerStrip
