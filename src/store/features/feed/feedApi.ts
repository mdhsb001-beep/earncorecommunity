import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Post, Comment, FeedResponse, User } from "./types";
import { getCookie } from "@/utils/cookies";

export const feedApi = createApi({
  reducerPath: "feedApi",
  baseQuery: fetchBaseQuery({ 
    baseUrl: process.env.NEXT_PUBLIC_API_URL,
    prepareHeaders: (headers) => {
      const token = getCookie("accessToken");
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      headers.set("content-type", "application/json");
      return headers;
    },
  }),
  tagTypes: ["Post", "Comment", "User", "Bookmark", "Like", "Follow"],
  endpoints: (builder) => ({
    getFeed: builder.query<FeedResponse, { 
      cursor?: string; 
      limit?: number; 
      community?: string;
      platform?: string;
      sortBy?: string;
      sortType?: string;
      search?: string;
      minQualityScore?: number;
      authentic?: boolean;
    }>({
      query: ({ cursor = "1", limit = 10, community, platform, sortBy, sortType, search, minQualityScore, authentic }) => ({
        url: "posts",
        params: {
          page: cursor,
          limit: limit,
          ...(community && { community }),
          ...(platform && { platform }),
          ...(sortBy && { sortBy }),
          ...(sortType && { sortType }),
          ...(search && { search }),
          ...(minQualityScore && { minQualityScore }),
          ...(authentic !== undefined && { authentic }),
        },
      }),
      transformResponse: (response: any) => {
        return response.data;
      },
      providesTags: (result) => [
        "Post",
        ...(result?.docs || []).map(({ _id }) => ({ type: "Post" as const, id: _id })),
      ],
    }),

    getPostById: builder.query<Post, string>({
      query: (postId) => `posts/${postId}`,
      transformResponse: (response: any) => response.data,
      providesTags: (result, error, postId) => [{ type: "Post", id: postId }],
    }),

    getPostComments: builder.query<{
      docs: Comment[];
      totalDocs: number;
      limit: number;
      page: number;
      totalPages: number;
    }, { postId: string; page?: number; limit?: number; sortBy?: string; sortType?: string }>({
      query: ({ postId, page = 1, limit = 10, sortBy = "createdAt", sortType = "desc" }) => ({
        url: `comments/post/${postId}`,
        params: { page, limit, sortBy, sortType },
      }),
      transformResponse: (response: any) => response.data,
      providesTags: (result, error, { postId }) => [
        { type: "Comment", id: `POST_${postId}` },
        ...(result?.docs || []).map(({ _id }) => ({ type: "Comment" as const, id: _id })),
      ],
    }),

    getCommentReplies: builder.query<{
      docs: Comment[];
      totalDocs: number;
      limit: number;
      page: number;
      totalPages: number;
    }, { commentId: string; page?: number; limit?: number }>({
      query: ({ commentId, page = 1, limit = 10 }) => ({
        url: `comments/${commentId}/replies`,
        params: { page, limit },
      }),
      transformResponse: (response: any) => response.data,
      providesTags: (result, error, { commentId }) => [
        { type: "Comment", id: `REPLIES_${commentId}` },
        ...(result?.docs || []).map(({ _id }) => ({ type: "Comment" as const, id: _id })),
      ],
    }),

    getUserProfile: builder.query<User, string>({
      query: (username) => `users/c/${username}`,
      transformResponse: (response: any) => response.data,
      providesTags: (result, error, username) => [{ type: "User", id: username }],
    }),

    // Like endpoints
    togglePostLike: builder.mutation<{ liked: boolean }, string>({
      query: (postId) => ({
        url: `likes/post/${postId}`,
        method: "POST",
      }),
      transformResponse: (response: any) => response.data,
      invalidatesTags: (result, error, postId) => [
        { type: "Post", id: postId },
        { type: "Like", id: `POST_${postId}` },
      ],
    }),

    toggleCommentLike: builder.mutation<{ liked: boolean }, string>({
      query: (commentId) => ({
        url: `comments/${commentId}/like`,
        method: "POST",
      }),
      transformResponse: (response: any) => response.data,
      invalidatesTags: (result, error, commentId) => [
        { type: "Comment", id: commentId },
        { type: "Like", id: `COMMENT_${commentId}` },
      ],
    }),

    getPostLikes: builder.query<{
      docs: Array<{ _id: string; user: User; createdAt: string }>;
      totalDocs: number;
      limit: number;
      page: number;
      totalPages: number;
    }, { postId: string; page?: number; limit?: number }>({
      query: ({ postId, page = 1, limit = 20 }) => ({
        url: `likes/post/${postId}/users`,
        params: { page, limit },
      }),
      transformResponse: (response: any) => response.data,
      providesTags: (result, error, { postId }) => [{ type: "Like", id: `POST_${postId}` }],
    }),

    getUserLikedPosts: builder.query<{
      docs: Array<{ _id: string; post: Post; createdAt: string }>;
      totalDocs: number;
      limit: number;
      page: number;
      totalPages: number;
    }, { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 10 }) => ({
        url: "likes/user/posts",
        params: { page, limit },
      }),
      transformResponse: (response: any) => response.data,
      providesTags: ["Like"],
    }),

    // Bookmark endpoints
    toggleBookmark: builder.mutation<{ bookmarked: boolean }, { postId: string; collection?: string }>({
      query: ({ postId, collection = "default" }) => ({
        url: `bookmarks/post/${postId}`,
        method: "POST",
        body: { collection },
      }),
      transformResponse: (response: any) => response.data,
      invalidatesTags: (result, error, { postId }) => [
        { type: "Post", id: postId },
        { type: "Bookmark", id: `POST_${postId}` },
        "Bookmark",
      ],
    }),

    getUserBookmarks: builder.query<{
      docs: Array<{ _id: string; collection: string; post: Post; createdAt: string }>;
      totalDocs: number;
      limit: number;
      page: number;
      totalPages: number;
    }, { page?: number; limit?: number; collection?: string }>({
      query: ({ page = 1, limit = 10, collection }) => ({
        url: "bookmarks",
        params: { 
          page, 
          limit,
          ...(collection && { collection }),
        },
      }),
      transformResponse: (response: any) => response.data,
      providesTags: ["Bookmark"],
    }),

    getBookmarkCollections: builder.query<Array<{
      collection: string;
      count: number;
      lastUpdated: string;
    }>, void>({
      query: () => "bookmarks/collections",
      transformResponse: (response: any) => response.data,
      providesTags: ["Bookmark"],
    }),

    checkBookmarkStatus: builder.query<{
      isBookmarked: boolean;
      collections: string[];
    }, string>({
      query: (postId) => `bookmarks/post/${postId}/status`,
      transformResponse: (response: any) => response.data,
      providesTags: (result, error, postId) => [{ type: "Bookmark", id: `POST_${postId}` }],
    }),

    // Follow endpoints
    toggleFollow: builder.mutation<{ following: boolean }, string>({
      query: (userId) => ({
        url: `follows/user/${userId}`,
        method: "POST",
      }),
      transformResponse: (response: any) => response.data,
      invalidatesTags: (result, error, userId) => [
        { type: "User", id: userId },
        { type: "Follow", id: `USER_${userId}` },
        "Follow",
      ],
    }),

    getUserFollowers: builder.query<{
      docs: Array<{ _id: string; follower: User; createdAt: string }>;
      totalDocs: number;
      limit: number;
      page: number;
      totalPages: number;
    }, { userId: string; page?: number; limit?: number }>({
      query: ({ userId, page = 1, limit = 20 }) => ({
        url: `follows/user/${userId}/followers`,
        params: { page, limit },
      }),
      transformResponse: (response: any) => response.data,
      providesTags: (result, error, { userId }) => [{ type: "Follow", id: `FOLLOWERS_${userId}` }],
    }),

    getUserFollowing: builder.query<{
      docs: Array<{ _id: string; following: User; createdAt: string }>;
      totalDocs: number;
      limit: number;
      page: number;
      totalPages: number;
    }, { userId: string; page?: number; limit?: number }>({
      query: ({ userId, page = 1, limit = 20 }) => ({
        url: `follows/user/${userId}/following`,
        params: { page, limit },
      }),
      transformResponse: (response: any) => response.data,
      providesTags: (result, error, { userId }) => [{ type: "Follow", id: `FOLLOWING_${userId}` }],
    }),

    getFollowStats: builder.query<{
      followers: number;
      following: number;
    }, string>({
      query: (userId) => `follows/user/${userId}/stats`,
      transformResponse: (response: any) => response.data,
      providesTags: (result, error, userId) => [{ type: "Follow", id: `STATS_${userId}` }],
    }),

    checkFollowStatus: builder.query<{ isFollowing: boolean }, string>({
      query: (userId) => `follows/user/${userId}/status`,
      transformResponse: (response: any) => response.data,
      providesTags: (result, error, userId) => [{ type: "Follow", id: `STATUS_${userId}` }],
    }),

    // Comment creation
    addComment: builder.mutation<Comment, { 
      content: string; 
      postId: string; 
      parentCommentId?: string;
    }>({
      query: ({ content, postId, parentCommentId }) => ({
        url: "comments",
        method: "POST",
        body: { content, postId, parentCommentId },
      }),
      transformResponse: (response: any) => response.data,
      invalidatesTags: (result, error, { postId, parentCommentId }) => [
        { type: "Comment", id: `POST_${postId}` },
        { type: "Post", id: postId },
        ...(parentCommentId ? [{ type: "Comment" as const, id: `REPLIES_${parentCommentId}` }] : []),
      ],
    }),

    // Update comment
    updateComment: builder.mutation<Comment, { commentId: string; content: string }>({
      query: ({ commentId, content }) => ({
        url: `comments/${commentId}`,
        method: "PATCH",
        body: { content },
      }),
      transformResponse: (response: any) => response.data,
      invalidatesTags: (result, error, { commentId }) => [
        { type: "Comment", id: commentId },
      ],
    }),

    // Delete comment
    deleteComment: builder.mutation<void, string>({
      query: (commentId) => ({
        url: `comments/${commentId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, commentId) => [
        { type: "Comment", id: commentId },
        "Comment",
        "Post",
      ],
    }),

    // User posts
    getUserPosts: builder.query<{
      docs: Post[];
      totalDocs: number;
      limit: number;
      page: number;
      totalPages: number;
    }, { userId: string; page?: number; limit?: number }>({
      query: ({ userId, page = 1, limit = 10 }) => ({
        url: `posts/user/${userId}`,
        params: { page, limit },
      }),
      transformResponse: (response: any) => response.data,
      providesTags: (result, error, { userId }) => [
        { type: "Post", id: `USER_${userId}` },
        ...(result?.docs || []).map(({ _id }) => ({ type: "Post" as const, id: _id })),
      ],
    }),

    // Update profile
    updateProfile: builder.mutation<User, { fullName: string; bio: string; avatar: string }>({
      query: (profileData) => ({
        url: "users/profile",
        method: "PATCH",
        body: profileData,
      }),
      transformResponse: (response: any) => response.data,
      invalidatesTags: ["User"],
    }),
  }),
});

export const {
  useGetFeedQuery,
  useGetPostByIdQuery,
  useGetPostCommentsQuery,
  useGetCommentRepliesQuery,
  useGetUserProfileQuery,
  useTogglePostLikeMutation,
  useToggleCommentLikeMutation,
  useGetPostLikesQuery,
  useGetUserLikedPostsQuery,
  useToggleBookmarkMutation,
  useGetUserBookmarksQuery,
  useGetBookmarkCollectionsQuery,
  useCheckBookmarkStatusQuery,
  useToggleFollowMutation,
  useGetUserFollowersQuery,
  useGetUserFollowingQuery,
  useGetFollowStatsQuery,
  useCheckFollowStatusQuery,
  useAddCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
  useGetUserPostsQuery,
  useUpdateProfileMutation,
} = feedApi;