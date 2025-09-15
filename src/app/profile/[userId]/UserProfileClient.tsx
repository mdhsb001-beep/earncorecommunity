"use client";

import { useState } from "react";
import { useGetUserProfileQuery, useGetUserPostsQuery } from "@/store/features/feed/feedApi";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostCard } from "@/components/feed/post-card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Users, 
  FileText, 
  Heart, 
  MessageCircle,
  UserPlus,
  UserCheck,
  ArrowLeft
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useToggleFollowMutation, useCheckFollowStatusQuery } from "@/store/features/feed/feedApi";
import { cn } from "@/lib/utils";

interface UserProfileClientProps {
  userId: string;
}

export default function UserProfileClient({ userId }: UserProfileClientProps) {
  const router = useRouter();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const [activeTab, setActiveTab] = useState("posts");
  
  const { data: user, isLoading: userLoading, error: userError } = useGetUserProfileQuery(userId);
  const { data: userPosts, isLoading: postsLoading } = useGetUserPostsQuery({ 
    userId, 
    page: 1, 
    limit: 10 
  });
  
  const { data: followStatus } = useCheckFollowStatusQuery(userId, {
    skip: !currentUser || currentUser._id === userId,
  });
  
  const [toggleFollow, { isLoading: isFollowLoading }] = useToggleFollowMutation();

  const isOwnProfile = currentUser?._id === userId;

  const handleFollowClick = async () => {
    if (!currentUser || isOwnProfile) return;
    
    try {
      await toggleFollow(userId).unwrap();
    } catch (error) {
      console.error("Failed to toggle follow:", error);
    }
  };

  if (userLoading) {
    return <UserProfileSkeleton />;
  }

  if (userError || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-bold mb-2">User not found</h2>
          <p className="text-muted-foreground mb-6">
            The user you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <Avatar className="h-32 w-32">
                  <AvatarImage 
                    src={user.avatar} 
                    alt={user.fullName}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-2xl">
                    {user.fullName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Profile Info */}
              <div className="flex-1 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-2xl font-bold">{user.fullName}</h1>
                      {user.isVerified && (
                        <Badge variant="secondary" className="text-xs">
                          Verified
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground">@{user.username}</p>
                  </div>

                  {/* Follow Button */}
                  {!isOwnProfile && currentUser && (
                    <Button
                      onClick={handleFollowClick}
                      disabled={isFollowLoading}
                      variant={followStatus?.isFollowing ? "outline" : "default"}
                      className="w-full sm:w-auto"
                    >
                      {followStatus?.isFollowing ? (
                        <>
                          <UserCheck className="w-4 h-4 mr-2" />
                          Following
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Follow
                        </>
                      )}
                    </Button>
                  )}

                  {isOwnProfile && (
                    <Button 
                      onClick={() => router.push("/my-profile")}
                      variant="outline"
                      className="w-full sm:w-auto"
                    >
                      Edit Profile
                    </Button>
                  )}
                </div>

                {/* Bio */}
                {user.bio && (
                  <p className="text-foreground leading-relaxed">{user.bio}</p>
                )}

                {/* Stats */}
                <div className="flex flex-wrap gap-6 text-sm">
                  <div className="flex items-center gap-1">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{user.postsCount || 0}</span>
                    <span className="text-muted-foreground">posts</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{user.followersCount || 0}</span>
                    <span className="text-muted-foreground">followers</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{user.followingCount || 0}</span>
                    <span className="text-muted-foreground">following</span>
                  </div>
                  {user.createdAt && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Joined {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="posts">Posts</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-6">
            {postsLoading ? (
              <div className="space-y-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                  </Card>
                ))}
              </div>
            ) : userPosts?.docs?.length ? (
              <div className="space-y-6">
                {userPosts.docs.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                <p className="text-muted-foreground">
                  {isOwnProfile 
                    ? "You haven't created any posts yet." 
                    : `${user.fullName} hasn't posted anything yet.`
                  }
                </p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function UserProfileSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <Skeleton className="h-10 w-20 mb-6" />
        
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-6">
              <Skeleton className="h-32 w-32 rounded-full" />
              <div className="flex-1 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-10 w-24" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="flex gap-6">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-18" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}