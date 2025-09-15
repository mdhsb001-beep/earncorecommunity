"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { 
  useGetUserBookmarksQuery, 
  useGetUserLikedPostsQuery,
  useGetUserPostsQuery,
  useUpdateProfileMutation
} from "@/store/features/feed/feedApi";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostCard } from "@/components/feed/post-card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Calendar, 
  Users, 
  FileText, 
  Heart, 
  Bookmark,
  Edit,
  Save,
  X,
  Camera
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function MyProfilePage() {
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  
  // Form state for editing
  const [editForm, setEditForm] = useState({
    fullName: currentUser?.fullName || "",
    bio: currentUser?.bio || "",
    avatar: currentUser?.avatar || "",
  });

  // API queries
  const { data: userPosts, isLoading: postsLoading } = useGetUserPostsQuery({ 
    userId: currentUser?._id || "", 
    page: 1, 
    limit: 10 
  }, { skip: !currentUser });

  const { data: likedPosts, isLoading: likedLoading } = useGetUserLikedPostsQuery({ 
    page: 1, 
    limit: 10 
  });

  const { data: bookmarks, isLoading: bookmarksLoading } = useGetUserBookmarksQuery({ 
    page: 1, 
    limit: 10 
  });

  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();

  const handleSaveProfile = async () => {
    try {
      await updateProfile(editForm).unwrap();
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error("Failed to update profile");
      console.error("Profile update error:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditForm({
      fullName: currentUser?.fullName || "",
      bio: currentUser?.bio || "",
      avatar: currentUser?.avatar || "",
    });
    setIsEditing(false);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-bold mb-2">Please log in</h2>
          <p className="text-muted-foreground mb-6">
            You need to be logged in to view your profile.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>My Profile</CardTitle>
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} variant="outline">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={handleSaveProfile} disabled={isUpdating}>
                    <Save className="w-4 h-4 mr-2" />
                    {isUpdating ? "Saving..." : "Save"}
                  </Button>
                  <Button onClick={handleCancelEdit} variant="outline">
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0 relative">
                <Avatar className="h-32 w-32">
                  <AvatarImage 
                    src={isEditing ? editForm.avatar : currentUser.avatar} 
                    alt={currentUser.fullName}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-2xl">
                    {currentUser.fullName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute bottom-0 right-0 rounded-full h-8 w-8 p-0"
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1 space-y-4">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={editForm.fullName}
                        onChange={(e) => setEditForm(prev => ({ ...prev, fullName: e.target.value }))}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={editForm.bio}
                        onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                        placeholder="Tell us about yourself..."
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="avatar">Avatar URL</Label>
                      <Input
                        id="avatar"
                        value={editForm.avatar}
                        onChange={(e) => setEditForm(prev => ({ ...prev, avatar: e.target.value }))}
                        placeholder="Enter avatar image URL"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-2xl font-bold">{currentUser.fullName}</h1>
                        {currentUser.isVerified && (
                          <Badge variant="secondary" className="text-xs">
                            Verified
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground">@{currentUser.username}</p>
                    </div>

                    {/* Bio */}
                    {currentUser.bio && (
                      <p className="text-foreground leading-relaxed">{currentUser.bio}</p>
                    )}

                    {/* Stats */}
                    <div className="flex flex-wrap gap-6 text-sm">
                      <div className="flex items-center gap-1">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{currentUser.postsCount || 0}</span>
                        <span className="text-muted-foreground">posts</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{currentUser.followersCount || 0}</span>
                        <span className="text-muted-foreground">followers</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{currentUser.followingCount || 0}</span>
                        <span className="text-muted-foreground">following</span>
                      </div>
                      {currentUser.createdAt && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Joined {formatDistanceToNow(new Date(currentUser.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="posts">My Posts</TabsTrigger>
            <TabsTrigger value="liked">Liked Posts</TabsTrigger>
            <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-6">
            {postsLoading ? (
              <PostsSkeleton />
            ) : userPosts?.docs?.length ? (
              <div className="space-y-6">
                {userPosts.docs.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))}
              </div>
            ) : (
              <EmptyState 
                icon={FileText}
                title="No posts yet"
                description="You haven't created any posts yet. Share your thoughts with the community!"
              />
            )}
          </TabsContent>

          <TabsContent value="liked" className="mt-6">
            {likedLoading ? (
              <PostsSkeleton />
            ) : likedPosts?.docs?.length ? (
              <div className="space-y-6">
                {likedPosts.docs.map((item) => (
                  <PostCard key={item._id} post={item.post} />
                ))}
              </div>
            ) : (
              <EmptyState 
                icon={Heart}
                title="No liked posts"
                description="Posts you like will appear here."
              />
            )}
          </TabsContent>

          <TabsContent value="bookmarks" className="mt-6">
            {bookmarksLoading ? (
              <PostsSkeleton />
            ) : bookmarks?.docs?.length ? (
              <div className="space-y-6">
                {bookmarks.docs.map((item) => (
                  <PostCard key={item._id} post={item.post} />
                ))}
              </div>
            ) : (
              <EmptyState 
                icon={Bookmark}
                title="No bookmarks"
                description="Posts you bookmark will appear here for easy access later."
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function PostsSkeleton() {
  return (
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
  );
}

function EmptyState({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: any; 
  title: string; 
  description: string; 
}) {
  return (
    <Card className="p-8 text-center">
      <Icon className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </Card>
  );
}