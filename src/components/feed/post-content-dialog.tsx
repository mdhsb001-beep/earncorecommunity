"use client";

import { formatDistanceToNow } from "date-fns";
import { ExternalLink, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Post } from "@/store/features/feed/types";

interface PostContentDialogProps {
  post: Post;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PostContentDialog({
  post,
  open,
  onOpenChange,
}: PostContentDialogProps) {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  className="object-cover"
                  src={post?.owner?.avatar}
                  alt={post?.owner?.fullName}
                />
                <AvatarFallback>{post?.owner?.fullName?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center space-x-2">
                  <DialogTitle className="text-lg font-semibold">
                    {post?.owner?.fullName}
                  </DialogTitle>
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
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 max-h-[calc(90vh-120px)]">
          <div className="pb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-6 leading-tight">
              {post.title}
            </h1>
            
            {post.image && (
              <div className="mb-6">
                <img
                  src={post.image}
                  alt="Post image"
                  className="w-full rounded-lg object-cover max-h-[400px] md:max-h-[500px]"
                />
              </div>
            )}
            
            <div className="prose prose-lg max-w-none leading-relaxed text-foreground">
              <div
                dangerouslySetInnerHTML={{
                  __html: formatContent(post.content),
                }}
              />
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}