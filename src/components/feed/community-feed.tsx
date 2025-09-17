"use client";

import { useState, useCallback, useEffect } from "react";
import { useGetCommunityBySlugQuery } from "@/store/features/community/communityApi";
import { PostCard } from "./post-card";
import { PostSkeleton } from "./post-skeleton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, RefreshCw, Search, Loader2 } from "lucide-react";

interface CommunityFeedProps {
  communitySlug: string;
  initialSearch?: string;
}

export function CommunityFeed({ communitySlug, initialSearch }: CommunityFeedProps) {
  const [search, setSearch] = useState(initialSearch || "");
  const [searchInput, setSearchInput] = useState(initialSearch || "");
  const [offset, setOffset] = useState(0);
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  
  const limit = 10;

  const {
    data: communityData,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetCommunityBySlugQuery({
    slug: communitySlug,
    search: search || undefined,
    limit,
    offset,
  });

  // Reset posts when search changes
  useEffect(() => {
    if (offset === 0) {
      setAllPosts(communityData?.posts || []);
      setHasMore((communityData?.posts?.length || 0) >= limit);
    }
  }, [communityData, offset, limit]);

  // Append posts when loading more
  useEffect(() => {
    if (offset > 0 && communityData?.posts) {
      setAllPosts(prev => [...prev, ...communityData.posts]);
      setHasMore(communityData.posts.length >= limit);
    }
  }, [communityData, offset, limit]);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setOffset(0);
    setAllPosts([]);
  }, [searchInput]);

  const handleLoadMore = useCallback(() => {
    if (!isFetching && hasMore) {
      setOffset(prev => prev + limit);
    }
  }, [isFetching, hasMore, limit]);

  const handleRetry = useCallback(() => {
    setOffset(0);
    setAllPosts([]);
    refetch();
  }, [refetch]);

  // Initial loading state
  if (isLoading && offset === 0) {
    return (
      <div className="space-y-6">
        {/* Search skeleton */}
        <Card className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 h-10 bg-muted animate-pulse rounded-md" />
            <div className="w-20 h-10 bg-muted animate-pulse rounded-md" />
          </div>
        </Card>
        
        {/* Posts skeleton */}
        {Array.from({ length: 5 }).map((_, i) => (
          <PostSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Error state
  if (error && allPosts.length === 0) {
    return (
      <div className="space-y-6">
        {/* Search bar */}
        <Card className="p-4">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search posts in this community..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={isFetching}>
              {isFetching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Search"
              )}
            </Button>
          </form>
        </Card>

        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to load community posts</h3>
          <p className="text-muted-foreground mb-4">
            Something went wrong while loading the posts. Please try again.
          </p>
          <Button onClick={handleRetry} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card className="p-4">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search posts in this community..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" disabled={isFetching}>
            {isFetching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Search"
            )}
          </Button>
        </form>
      </Card>

      {/* Posts */}
      {allPosts.length > 0 ? (
        <>
          {allPosts.map((post) => (
            <PostCard key={post._id} post={post} />
          ))}

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center py-4">
              <Button
                onClick={handleLoadMore}
                disabled={isFetching}
                variant="outline"
                className="w-full max-w-xs"
              >
                {isFetching ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading more posts...
                  </>
                ) : (
                  "Load More Posts"
                )}
              </Button>
            </div>
          )}

          {/* End of posts indicator */}
          {!hasMore && (
            <div className="text-center py-8 text-muted-foreground">
              <div className="flex items-center justify-center gap-2">
                <div className="h-px bg-border flex-1 max-w-20" />
                <span className="text-sm">You've reached the end</span>
                <div className="h-px bg-border flex-1 max-w-20" />
              </div>
            </div>
          )}
        </>
      ) : (
        // Empty state
        <Card className="p-8 text-center">
          <div className="text-muted-foreground">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No posts found</h3>
            <p>
              {search 
                ? `No posts found matching "${search}" in this community`
                : "This community doesn't have any posts yet"
              }
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}