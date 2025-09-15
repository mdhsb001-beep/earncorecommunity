import { InfiniteFeed } from "@/components/feed/infinite-feed";
import { FeedFilters } from "@/components/feed/feed-filters";
import React from "react";

const FeedPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
  const filters = await searchParams;
  
  // Extract filter parameters
  const sortBy = typeof filters.sortBy === 'string' ? filters.sortBy : 'createdAt';
  const sortType = typeof filters.sortType === 'string' ? filters.sortType : 'desc';
  const search = typeof filters.search === 'string' ? filters.search : undefined;
  const minQualityScore = typeof filters.minQualityScore === 'string' 
    ? parseFloat(filters.minQualityScore) 
    : undefined;
  const authentic = filters.authentic !== 'false';

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Feed</h1>
          <p className="text-foreground">
            Discover what's happening in your communities
          </p>
        </header>

        <div className="mb-6">
          <FeedFilters 
            currentSortBy={sortBy}
            currentSortType={sortType}
            currentSearch={search}
            currentMinQualityScore={minQualityScore}
            currentAuthentic={authentic}
          />
        </div>

        <InfiniteFeed
          sortBy={sortBy}
          sortType={sortType}
          search={search}
          minQualityScore={minQualityScore}
          authentic={authentic}
        />
      </div>
    </div>
  );
};

export default FeedPage;