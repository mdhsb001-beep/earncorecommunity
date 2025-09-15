"use client";

import { formatDistanceToNow } from "date-fns";
import { Calendar, Users, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetUserProfileQuery } from "@/store/features/feed/feedApi";
import { useRouter } from "next/navigation";

interface ProfileDialogProps {
  username: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileDialog({
  username,
  open,
  onOpenChange,
}: ProfileDialogProps) {
  const router = useRouter();
  const { data: user, isLoading } = useGetUserProfileQuery(username, {
    skip: !open,
  });

  const handleViewFullProfile = () => {
    if (user) {
      onOpenChange(false);
      router.push(`/profile/${user._id}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Profile</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        ) : user ? (
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="flex items-start space-x-4">
              <Avatar className="h-16 w-16 ">
                <AvatarImage
                  className="object-cover"
                  src={user?.avatar}
                  alt={user?.fullName}
                />
                <AvatarFallback className="text-lg">
                  {user?.fullName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-bold text-foreground">
                    {user.fullName}
                  </h3>
                  {user.isVerified && (
                    <Badge variant="secondary" className="text-xs">
                      Verified
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  @{user.username}
                </p>
                <Button size="sm" className="w-full" onClick={handleViewFullProfile}>
                  View Profile
                </Button>
              </div>
            </div>

            {/* Bio */}
            {user.bio && (
              <p className="text-foreground">{user.bio}</p>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="space-y-1">
                <div className="flex flex-col items-center">
                  <FileText className="h-5 w-5 text-muted-foreground mb-1" />
                  <span className="text-lg font-bold text-foreground">
                    {user.postsCount || 0}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">Posts</span>
              </div>
              <div className="space-y-1">
                <div className="flex flex-col items-center">
                  <Users className="h-5 w-5 text-muted-foreground mb-1" />
                  <span className="text-lg font-bold text-foreground">
                    {user.followersCount || 0}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">Followers</span>
              </div>
              <div className="space-y-1">
                <div className="flex flex-col items-center">
                  <Users className="h-5 w-5 text-muted-foreground mb-1" />
                  <span className="text-lg font-bold text-foreground">
                    {user.followingCount || 0}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">Following</span>
              </div>
            </div>

            {/* Join Date */}
            {user.createdAt && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  Joined {formatDistanceToNow(new Date(user.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
