import type { NewsArticleRead, NewsCategoryRead } from '../../api/types'
import { NewsList } from '../../components/news/NewsList'
import { NewsCategories } from '../../components/news/NewsCategories'

interface NewsSectionProps {
  currentPage: string
  newsLoadError: string | null
  newsData: NewsArticleRead[]
  newsCategoryData: NewsCategoryRead[]
  loadNewsArticles: () => void | Promise<void>
  loadNewsCategories: () => void | Promise<void>
}

export function NewsSection({
  currentPage,
  newsLoadError,
  newsData,
  newsCategoryData,
  loadNewsArticles,
  loadNewsCategories,
}: NewsSectionProps) {
  return (
    <>
      {currentPage === 'news' && (
        <div className="dashboard-page">
          <h1 className="dashboard-page-title">News</h1>
          {newsLoadError && (
            <p className="dashboard-page-lead" style={{ color: '#ef4444' }}>
              {newsLoadError}
            </p>
          )}
        </div>
      )}
      {currentPage === 'news-news' && (
        <div className="dashboard-page">
          <div className="dashboard-page-header-row">
            <h1 className="dashboard-page-title">News — Articles</h1>
          </div>
          {newsLoadError && (
            <p className="dashboard-page-lead" style={{ color: '#ef4444' }}>
              {newsLoadError}
            </p>
          )}
          <NewsList
            articles={newsData}
            categories={newsCategoryData.map((c) => ({
              id: c.id,
              name: c.name,
            }))}
            onRefresh={loadNewsArticles}
          />
        </div>
      )}
      {currentPage === 'news-categories' && (
        <div className="dashboard-page">
          <div className="dashboard-page-header-row">
            <h1 className="dashboard-page-title">News — Categories</h1>
          </div>
          {newsLoadError && (
            <p className="dashboard-page-lead" style={{ color: '#ef4444' }}>
              {newsLoadError}
            </p>
          )}
          <NewsCategories
            categories={newsCategoryData}
            onRefresh={loadNewsCategories}
          />
        </div>
      )}
    </>
  )
}
