import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { CommunityTypes, CommunityWithPosts } from "./types";
import { getCookie } from "@/utils/cookies";

export const communityApi = createApi({
  reducerPath: "communityApi",
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
  tagTypes: ["Community", "CommunityMembership"],
  endpoints: (builder) => ({
    getAllCommunities: builder.query<CommunityTypes[], void>({
      query: () => "community",
      transformResponse: (res: { data: CommunityTypes[] }) => res.data,
      providesTags: ["Community"],
    }),
    
    getCommunityBySlug: builder.query<CommunityWithPosts, {
      slug: string;
      search?: string;
      limit?: number;
      offset?: number;
    }>({
      query: ({ slug, search, limit = 10, offset = 0 }) => ({
        url: `community/slug/${slug}`,
        params: {
          ...(search && { search }),
          limit,
          offset,
        },
      }),
      transformResponse: (res: { data: CommunityWithPosts }) => res.data,
      providesTags: (result, error, { slug }) => [
        { type: "Community", id: slug },
      ],
    }),

    joinCommunity: builder.mutation<{ message: string; joined: boolean }, string>({
      query: (communityId) => ({
        url: `community/join/${communityId}`,
        method: "POST",
      }),
      transformResponse: (res: { data: { message: string; joined: boolean } }) => res.data,
      invalidatesTags: (result, error, communityId) => [
        { type: "Community", id: communityId },
        "CommunityMembership",
      ],
    }),

    leaveCommunity: builder.mutation<{ message: string; left: boolean }, string>({
      query: (communityId) => ({
        url: `community/leave/${communityId}`,
        method: "POST",
      }),
      transformResponse: (res: { data: { message: string; left: boolean } }) => res.data,
      invalidatesTags: (result, error, communityId) => [
        { type: "Community", id: communityId },
        "CommunityMembership",
      ],
    }),

    getUserCommunityMembership: builder.query<{ isJoined: boolean }, string>({
      query: (communityId) => `community/${communityId}/membership`,
      transformResponse: (res: { data: { isJoined: boolean } }) => res.data,
      providesTags: (result, error, communityId) => [
        { type: "CommunityMembership", id: communityId },
      ],
    }),
  }),
});

export const { 
  useGetAllCommunitiesQuery,
  useGetCommunityBySlugQuery,
  useJoinCommunityMutation,
  useLeaveCommunityMutation,
  useGetUserCommunityMembershipQuery,
} = communityApi;