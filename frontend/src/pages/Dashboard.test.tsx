import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Dashboard from "./Dashboard";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// Mock Clerk
vi.mock("@clerk/clerk-react", () => ({
  useUser: () => ({
    isSignedIn: true,
    user: {
      firstName: "Admin",
      fullName: "Admin User",
    },
  }),
  UserButton: () => <div data-testid="user-button" />,
  SignInButton: () => <button>Sign In</button>,
}));

// Mock the API module
vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(),
  },
}));

import { api } from "@/lib/api";

describe("Dashboard Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock responses
    (api.get as any).mockImplementation((url: string) => {
      if (url === "/agents") return Promise.resolve([]);
      if (url === "/agents/stats") return Promise.resolve({
        agent_trend: "+2 this week",
        message_count: 150,
        message_trend: "+12%",
        avg_latency_ms: 240,
        latency_trend: "-15ms"
      });
      return Promise.resolve([]);
    });
  });

  it("renders the welcome message", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      </QueryClientProvider>
    );
    
    expect(await screen.findByText(/Welcome back, Admin/i)).toBeInTheDocument();
  });

  it("renders the statistics cards", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      </QueryClientProvider>
    );
    
    expect(await screen.findByText(/Active agents/i)).toBeInTheDocument();
    expect(await screen.findByText(/Messages total/i)).toBeInTheDocument();
  });

  it("renders the agents list", async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url === "/agents") return Promise.resolve([
        { id: 1, name: "Stripe Payments Agent", base_url: "http://api.stripe.com", status: "live", created_at: new Date().toISOString(), endpoint_count: 5 },
        { id: 2, name: "Notion Workspace Bot", base_url: "http://api.notion.com", status: "draft", created_at: new Date().toISOString(), endpoint_count: 3 },
      ]);
      return Promise.resolve({});
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      </QueryClientProvider>
    );
    
    expect(await screen.findByText(/Stripe Payments Agent/i)).toBeInTheDocument();
    expect(await screen.findByText(/Notion Workspace Bot/i)).toBeInTheDocument();
  });
});
