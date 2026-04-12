export interface Schedule {
  days_of_week?: string[];
  time_of_day?: string;
}

export interface Settings {
  enabled: boolean;
  schedule?: Schedule;
}

export interface Target {
  _id: string;
  name: string;
  description?: string;
  keywords: string[];
  domain_names: string[];
  ip_addresses: string[];
  client_id?: string; // Added based on API response
  created_by?: string;
  settings?: Settings; // Added based on API response
  modules?: string[]; // Added based on API response
  partners_affiliates: string[];
  locations: string[];
  sector: string;
  public_exposure: {
    social_media_handles: {
      twitter: string;
      facebook: string;
      linkedin: string;
    };
    public_forums: string[];
    public_reports: string[];
  };
  technologies?: string[]; // Added based on API response
  owner?: string;
  created_at?: string;
  updated_at?: string; // Added based on API response
  last_run?: string;
  reports?: Array<{
    date_of_analysis: string;
    average_sentiment_score: number;
    summary?: string;
    aggregated_entities?: {
      events: string[];
    };
    sources?: { [key: string]: any };
    // Add other report properties if needed and available from the API
  }>;
}
