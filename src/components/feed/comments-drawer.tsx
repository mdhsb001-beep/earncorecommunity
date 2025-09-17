"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Send, Smile, Heart, MessageCircle, MoreHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useGetPostCommentsQuery,
  useGetCommentRepliesQuery,
  useAddCommentMutation,
  useToggleCommentLikeMutation,
} from "@/store/features/feed/feedApi";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { Comment } from "@/store/features/feed/types";
import { AuthPopup } from "@/components/auth-popup";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

interface CommentsDrawerProps {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CommentItemProps {
  comment: Comment;
  postId: string;
  isReply?: boolean;
}

function CommentItem({ comment, postId, isReply = false }: CommentItemProps) {
  const [showReplies, setShowReplies] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [isLiked, setIsLiked] = useState(comment.isLoved);
  const [likesCount, setLikesCount] = useState(comment.likes || comment.lovesCount || 0);

  const [toggleCommentLike] = useToggleCommentLikeMutation();
  const [addComment] = useAddCommentMutation();

  const {
    data: repliesData,
    isLoading: repliesLoading,
  } = useGetCommentRepliesQuery(
    { commentId: comment._id },
    { skip: !showReplies || isReply }
  );

  const handleLikeClick = async () => {
    try {
      const result = await toggleCommentLike(comment._id).unwrap();
      setIsLiked(result.liked);
      setLikesCount(prev => result.liked ? prev + 1 : prev - 1);
    } catch (error) {
      console.error("Failed to toggle comment like:", error);
    }
  };

  const handleReplySubmit = async () => {
    if (!replyContent.trim()) return;

    try {
      await addComment({
        content: replyContent,
        postId,
        parentCommentId: comment._id,
      }).unwrap();
      setReplyContent("");
      setIsReplying(false);
    } catch (error) {
      console.error("Failed to add reply:", error);
    }
  };

  return (
    <div className={cn("space-y-3", isReply && "ml-8")}>
      <div className="flex space-x-3">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage
            src={comment.owner.avatar}
            alt={comment.owner.fullName}
          />
          <AvatarFallback className="text-xs">
            {comment.owner.fullName?.charAt(0)}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-2">
          <div className="bg-muted rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-sm text-foreground">
                  {comment.owner.fullName}
                </span>
                <span className="text-xs text-muted-foreground">
                  @{comment.owner.username}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.createdAt), {
                    addSuffix: true,
                  })}
                </span>
                {comment.isEdited && (
                  <span className="text-xs text-muted-foreground">(edited)</span>
                )}
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Report</DropdownMenuItem>
                  <DropdownMenuItem>Copy link</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {comment.content}
            </p>
          </div>
          
          <div className="flex items-center space-x-4 px-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLikeClick}
              className={cn(
                "h-6 px-2 text-xs hover:bg-red-50 dark:hover:bg-red-950/20",
                isLiked
                  ? "text-red-600 dark:text-red-400"
                  : "text-muted-foreground"
              )}
            >
              <Heart
                className={cn(
                  "h-3 w-3 mr-1",
                  isLiked && "fill-current"
                )}
              />
              {likesCount > 0 && likesCount}
            </Button>
            
            {!isReply && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsReplying(!isReplying)}
                className="h-6 px-2 text-xs text-muted-foreground hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:text-blue-600"
              >
                <MessageCircle className="h-3 w-3 mr-1" />
                Reply
              </Button>
            )}
            
            {!isReply && comment.replyCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplies(!showReplies)}
                className="h-6 px-2 text-xs text-muted-foreground"
              >
                {showReplies ? (
                  <ChevronUp className="h-3 w-3 mr-1" />
                ) : (
                  <ChevronDown className="h-3 w-3 mr-1" />
                )}
                {comment.replyCount} {comment.replyCount === 1 ? 'reply' : 'replies'}
              </Button>
            )}
          </div>
          
          {/* Reply input */}
          {isReplying && (
            <div className="space-y-2 px-3">
              <Textarea
                placeholder="Write a reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="resize-none text-sm"
                rows={2}
              />
              <div className="flex justify-end space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsReplying(false);
                    setReplyContent("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleReplySubmit}
                  disabled={!replyContent.trim()}
                >
                  Reply
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Replies */}
      {showReplies && !isReply && (
        <div className="space-y-3">
          {repliesLoading ? (
            <div className="ml-8 space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex space-x-3">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            repliesData?.docs?.map((reply) => (
              <CommentItem
                key={reply._id}
                comment={reply}
                postId={postId}
                isReply={true}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function CommentsDrawer({
  postId,
  open,
  onOpenChange,
}: CommentsDrawerProps) {
  const [newComment, setNewComment] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 10;

  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  const { data: comments, isLoading } = useGetPostCommentsQuery(
    { postId, page, limit },
    { skip: !open }
  );

  const [addComment, { isLoading: isAddingComment }] = useAddCommentMutation();

  const handleSubmitComment = async () => {
    if (!isAuthenticated) {
      setShowAuthPopup(true);
      return;
    }

    if (!newComment.trim()) return;

    try {
      await addComment({ postId, content: newComment }).unwrap();
      setNewComment("");
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
  };

  const handleEmojiSelect = (emoji: any) => {
    setNewComment((prev) => prev + emoji.emoji);
    setShowEmojiPicker(false);
  };

  const loadMoreComments = () => {
    if (comments?.totalPages && page < comments.totalPages) {
      setPage(prev => prev + 1);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[85vh]">
        <DrawerHeader>
          <DrawerTitle>
            Comments {comments?.totalDocs ? `(${comments.totalDocs})` : ''}
          </DrawerTitle>
        </DrawerHeader>

        <div className="flex flex-col flex-1 min-h-0">
          {/* Comments List */}
          <ScrollArea className="flex-1 px-6">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex space-x-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6 pb-4">
                {comments?.docs?.map((comment) => (
                  <CommentItem
                    key={comment._id}
                    comment={comment}
                    postId={postId}
                  />
                ))}
                
                {/* Load more comments */}
                {comments?.totalPages && page < comments.totalPages && (
                  <div className="text-center py-4">
                    <Button
                      variant="outline"
                      onClick={loadMoreComments}
                      className="w-full"
                    >
                      Load more comments ({comments.totalDocs - (page * limit)} remaining)
                    </Button>
                  </div>
                )}
                
                {comments?.docs?.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No comments yet. Be the first to comment!</p>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Comment Input */}
          <div className="border-t border-border p-4 space-y-3">
            <div className="relative">
              <Textarea
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="resize-none pr-20"
                rows={3}
              />
              <div className="absolute bottom-2 right-2 flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="h-8 w-8 p-0"
                >
                  <Smile className="h-4 w-4" />
                </Button>
                <Button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || isAddingComment}
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {showEmojiPicker && (
              <div className="absolute bottom-full right-4 z-50">
                <EmojiPicker
                  onEmojiClick={handleEmojiSelect}
                  width={300}
                  height={400}
                />
              </div>
            )}
          </div>
        </div>
      </DrawerContent>

      <AuthPopup
        isOpen={showAuthPopup}
        onClose={() => setShowAuthPopup(false)}
        action="comment"
      />
    </Drawer>
  );
}