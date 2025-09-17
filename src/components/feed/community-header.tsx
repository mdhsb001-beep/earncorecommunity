"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { 
  useGetAllCommunitiesQuery,
  useJoinCommunityMutation,
  useLeaveCommunityMutation,
  useGetUserCommunityMembershipQuery,
} from "@/store/features/community/communityApi";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, FileText, Calendar, UserPlus, UserCheck, Loader2 } from "lucide-react";
import { AuthPopup } from "@/components/auth-popup";
import { toast } from "sonner";

interface CommunityHeaderProps {
  communitySlug: string;
}

export function CommunityHeader({ communitySlug }: CommunityHeaderProps) {
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  
  const { data: communities, isLoading } = useGetAllCommunitiesQuery();
  
  const community = communities?.find(
    c => c.name.toLowerCase().replace(/\s+/g, '-') === communitySlug.toLowerCase()
  );

  const { data: membershipData } = useGetUserCommunityMembershipQuery(
    community?._id || "",
    { skip: !community?._id || !isAuthenticated }
  );

  const [joinCommunity, { isLoading: isJoining }] = useJoinCommunityMutation();
  const [leaveCommunity, { isLoading: isLeaving }] = useLeaveCommunityMutation();

  const handleJoinClick = async () => {
    if (!isAuthenticated) {
      setShowAuthPopup(true);
      return;
    }

    if (!community) return;

    try {
      if (membershipData?.isJoined) {
        const result = await leaveCommunity(community._id).unwrap();
        toast.success(result.message || "Left community successfully!");
      } else {
        const result = await joinCommunity(community._id).unwrap();
        toast.success(result.message || "Joined community successfully!");
      }
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update membership");
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6 mb-8">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full max-w-md" />
            <div className="flex space-x-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (!community) {
    return (
      <Card className="p-6 mb-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold capitalize mb-2">
            {communitySlug.replace(/-/g, ' ')}
          </h1>
          <p className="text-muted-foreground">
            Community information not available
          </p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6 mb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4 flex-1">
            <Avatar className="h-16 w-16">
              <AvatarImage 
                src={community.icon} 
                alt={community.name}
                className="object-cover"
              />
              <AvatarFallback className="text-lg font-bold">
                {community.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-3">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-2xl font-bold">{community.name}</h1>
                  <Badge variant="secondary" className="capitalize">
                    {community.category.replace(/-/g, ' ')}
                  </Badge>
                </div>
                
                {community.description && (
                  <p className="text-muted-foreground leading-relaxed">
                    {community.description}
                  </p>
                )}
              </div>
              
              <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>
                    {community.memberCount?.toLocaleString() || 0} members
                  </span>
                </div>
                
                <div className="flex items-center space-x-1">
                  <FileText className="h-4 w-4" />
                  <span>
                    {community.postCount?.toLocaleString() || 0} posts
                  </span>
                </div>
                
                {community.lastUpdatedAt && (
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Updated {new Date(community.lastUpdatedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Join/Leave Button */}
          <div className="ml-4">
            <Button
              onClick={handleJoinClick}
              disabled={isJoining || isLeaving}
              variant={membershipData?.isJoined ? "outline" : "default"}
              className="min-w-[120px]"
            >
              {(isJoining || isLeaving) ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : membershipData?.isJoined ? (
                <UserCheck className="w-4 h-4 mr-2" />
              ) : (
                <UserPlus className="w-4 h-4 mr-2" />
              )}
              {(isJoining || isLeaving) 
                ? "Loading..." 
                : membershipData?.isJoined 
                  ? "Joined" 
                  : "Join Community"
              }
            </Button>
          </div>
        </div>
      </Card>

      <AuthPopup
        isOpen={showAuthPopup}
        onClose={() => setShowAuthPopup(false)}
        action="like"
        title="Join Community"
      />
    </>
  );
}
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>
                  Updated {new Date(community.lastUpdatedAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}