import { InfiniteFeed } from "@/components/feed/infinite-feed";
import { CommunityHeader } from "@/components/feed/community-header";
import { FeedFilters } from "@/components/feed/feed-filters";
import React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const CommunityFeedPage = async ({
  params,
  searchParams,
}: {
  params: Promise<{ community: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
  const { community } = await params;
  const filters = await searchParams;

  // Convert community slug to proper format for API
  const communityName = community.replace(/-/g, ' ');
  
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
      <div className="bg-background sticky top-0 flex h-16 shrink-0 items-center z-50 gap-2 border-b px-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="/dashboard/feed">Feed</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage className="capitalize">
                {community.replace(/-/g, ' ')}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      
      <div className="max-w-4xl mx-auto py-8 px-4">
        <CommunityHeader communitySlug={community} />
        
        <div className="mb-6">
          <FeedFilters 
            currentCommunity={community}
            currentSortBy={sortBy}
            currentSortType={sortType}
            currentSearch={search}
            currentMinQualityScore={minQualityScore}
            currentAuthentic={authentic}
          />
        </div>

        <InfiniteFeed
          community={communityName}
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

export default CommunityFeedPage;