import type { ExploreReport } from "@/components/explore/ReportCard";

export interface DashboardReport extends ExploreReport {
  isPublic?: boolean;
  isUnlisted?: boolean;
  deletedAt?: string;
  isCollab?: boolean;
}

export interface CollabReport extends ExploreReport {
  collabStatus?: string;
}

/** Analytics data shape from /api/user/analytics */
export interface AnalyticsData {
  overview: {
    totalReports: number;
    totalViews: number;
    publicReports: number;
    privateReports: number;
    totalReactions: number;
    totalComments: number;
    totalSaves: number;
    followers: number;
  };
  topByViews: { id: string; species: string[]; tournamentName?: string; viewCount: number; isPublic: boolean; createdAt: string }[];
  recentReports: { id: string; species: string[]; tournamentName?: string; viewCount: number; createdAt: string }[];
  monthlyActivity: { month: string; count: number }[];
  topReactions: { type: string; count: number }[];
  engagement: { reportsWithReactions: number; reportsWithComments: number; reportsSaved: number };
}

/** Collection data from /api/user/collections */
export interface CollectionData {
  id: string;
  name: string;
  description?: string;
  regulation?: string;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}
