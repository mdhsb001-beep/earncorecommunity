"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  MoreHorizontal,
  BadgeCheck,
  UserPlus,
  UserCheck,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Post } from "@/store/features/feed/types";
import { ProfileDialog } from "./profile-dialog";
import { CommentsDrawer } from "./comments-drawer";
import { PostContentDialog } from "./post-content-dialog";
import {
  useTogglePostLikeMutation,
  useToggleBookmarkMutation,
  useToggleFollowMutation,
  useCheckFollowStatusQuery,
  useCheckBookmarkStatusQuery,
} from "@/store/features/feed/feedApi";
import { cn } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isCommentsDrawerOpen, setIsCommentsDrawerOpen] = useState(false);
  const [isContentDialogOpen, setIsContentDialogOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(post.isLoved);
  const [likesCount, setLikesCount] = useState(post.engagementMetrics?.likes || 0);
  
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const isOwnPost = currentUser?._id === post.owner._id;

  const [toggleLove, { isLoading: isLikeLoading }] = useTogglePostLikeMutation();
  const [toggleBookmark, { isLoading: isBookmarkLoading }] = useToggleBookmarkMutation();
  const [toggleFollow, { isLoading: isFollowLoading }] = useToggleFollowMutation();

  // Check follow status
  const { data: followStatus } = useCheckFollowStatusQuery(post.owner._id, {
    skip: isOwnPost || !currentUser,
  });

  // Check bookmark status
  const { data: bookmarkStatus } = useCheckBookmarkStatusQuery(post._id);

  const handleLoveClick = async () => {
    if (isLikeLoading) return;
    
    try {
      const result = await toggleLove(post._id).unwrap();
      setIsLiked(result.liked);
      setLikesCount(prev => result.liked ? prev + 1 : prev - 1);
    } catch (error) {
      console.error("Failed to toggle like:", error);
    }
  };

  const handleBookmarkClick = async () => {
    if (isBookmarkLoading) return;
    
    try {
      await toggleBookmark({ postId: post._id }).unwrap();
    } catch (error) {
      console.error("Failed to toggle bookmark:", error);
    }
  };

  const handleFollowClick = async () => {
    if (isFollowLoading || isOwnPost) return;
    
    try {
      await toggleFollow(post.owner._id).unwrap();
    } catch (error) {
      console.error("Failed to toggle follow:", error);
    }
  };

  const handleProfileClick = () => {
    setIsProfileDialogOpen(true);
  };

  const handleCommentsClick = () => {
    setIsCommentsDrawerOpen(true);
  };

  const handleContentClick = () => {
    setIsContentDialogOpen(true);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.content.substring(0, 100) + "...",
          url: post.sourceUrl || window.location.href,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(post.sourceUrl || window.location.href);
        // You could show a toast here
      } catch (error) {
        console.error("Failed to copy to clipboard:", error);
      }
    }
  };

  const formatContent = (content: string) => {
    if (!content) return "";

    return content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br>")
      .replace(/^(\s*)\* (.+)/gm, "$1• $2")
      .replace(
        /^>\s*(.+)/gm,
        '<blockquote class="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-2">$1</blockquote>'
      );
  };

  const truncateContent = (content: string, maxLength: number = 300) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  const shouldShowReadMore = post.content && post.content.length > 300;

  return (
    <>
      <article className="bg-card rounded-lg border border-border hover:border-accent transition-colors duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-4">
          <button
            onClick={handleProfileClick}
            className="flex items-center space-x-3 hover:bg-accent/50 rounded-lg p-2 -m-2 transition-colors duration-200 cursor-pointer"
          >
            <Avatar className="h-10 w-10">
              <AvatarImage
                className="object-cover"
                src={post?.owner?.avatar}
                alt={post?.owner?.fullName}
              />
              <AvatarFallback>{post?.owner?.fullName?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="text-left">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-foreground">
                  {post?.owner?.fullName}
                </span>
                {post?.owner?.isVerified && (
                  <BadgeCheck className="h-4 w-4 text-primary" />
                )}
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>@{post?.owner?.username}</span>
                <span>•</span>
                <span>
                  {formatDistanceToNow(new Date(post.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>
          </button>

          <div className="flex items-center space-x-1">
            {!isOwnPost && currentUser && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFollowClick}
                disabled={isFollowLoading}
                className={cn(
                  "h-8 px-3",
                  followStatus?.isFollowing
                    ? "text-primary hover:text-primary/80"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {followStatus?.isFollowing ? (
                  <UserCheck className="h-4 w-4" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBookmarkClick}
              disabled={isBookmarkLoading}
              className={cn(
                "h-8 w-8 p-0",
                bookmarkStatus?.isBookmarked ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Bookmark
                className={cn("h-4 w-4", bookmarkStatus?.isBookmarked && "fill-current")}
              />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 pb-4">
          <h2 className="text-xl font-bold text-foreground mb-3 leading-tight">
            {post.title}
          </h2>
          <div className="prose max-w-none leading-relaxed">
            <div
              dangerouslySetInnerHTML={{
                __html: formatContent(truncateContent(post.content)),
              }}
            />
            {shouldShowReadMore && (
              <button
                onClick={handleContentClick}
                className="text-primary hover:text-primary/80 font-medium mt-2 inline-block"
              >
                Read more
              </button>
            )}
          </div>
        </div>

        {/* Image */}
        {post.image && (
          <div className="px-4 pb-4">
            <img
              src={post.image}
              alt="Post image"
              className="w-full rounded-lg object-cover max-h-96 cursor-pointer"
              onClick={handleContentClick}
            />
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between p-4 pt-4 border-t border-border">
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLoveClick}
              disabled={isLikeLoading}
              className={cn(
                "flex items-center space-x-2 hover:bg-red-50 dark:hover:bg-red-950/20",
                isLiked
                  ? "text-red-600 dark:text-red-400"
                  : "text-muted-foreground"
              )}
            >
              <Heart
                className={cn(
                  "h-5 w-5",
                  isLiked && "fill-current text-red-600"
                )}
              />
              {likesCount > 0 && (
                <span className="text-sm font-medium">{likesCount}</span>
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCommentsClick}
              className="flex items-center space-x-2 text-muted-foreground hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:text-blue-600 dark:hover:text-blue-400"
            >
              <MessageCircle className="h-5 w-5" />
              {post.engagementMetrics?.comments > 0 && (
                <span className="text-sm font-medium">
                  {post.engagementMetrics.comments}
                </span>
              )}
            </Button>
          </div>

          <div className="flex items-center space-x-3">
            {post?.lovedBy && post.lovedBy.length > 0 && (
              <div className="flex -space-x-1">
                {post.lovedBy.slice(0, 3).map((user, index) => (
                  <Avatar
                    key={user?._id || index}
                    className="h-6 w-6 border-2 border-card"
                  >
                    <AvatarImage src={user?.avatar} alt={user?.fullName} />
                    <AvatarFallback className="text-xs">
                      {user?.fullName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
            )}
            
            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
              {post.engagementMetrics?.views > 0 && (
                <>
                  <span>{post.engagementMetrics.views} views</span>
                  <span>•</span>
                </>
              )}
              <span>{likesCount} loves</span>
              {post.engagementMetrics?.comments > 0 && (
                <>
                  <span>•</span>
                  <span>{post.engagementMetrics.comments} comments</span>
                </>
              )}
            </div>
          </div>
        </div>
      </article>

      <ProfileDialog
        username={post?.owner?.username}
        open={isProfileDialogOpen}
        onOpenChange={setIsProfileDialogOpen}
      />

      <CommentsDrawer
        postId={post?._id}
        open={isCommentsDrawerOpen}
        onOpenChange={setIsCommentsDrawerOpen}
      />

      <PostContentDialog
        post={post}
        open={isContentDialogOpen}
        onOpenChange={setIsContentDialogOpen}
      />
    </>
  );
}