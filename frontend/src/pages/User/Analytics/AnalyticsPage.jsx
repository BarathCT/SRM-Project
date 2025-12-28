import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import CampusAnalyticsCard from "../CampusAdminDashboard/components/CampusAnalyticsCard";
import SuperAdminAnalyticsCard from "../SuperAdminDashboard/components/SuperAdminAnalyticsCard";

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get data from location state or fetch it
  const { stats, papers, users, selectedCollege, selectedInstitute, loading, scopeLoading } = location.state || {};

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header with Back Button */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="text-blue-700 hover:text-blue-800 hover:bg-blue-50 p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
              Analytics Overview
            </h1>
          </div>
          <p className="text-sm sm:text-base text-gray-600">
            Comprehensive insights into publication metrics and trends
          </p>
        </div>

        {/* Analytics Content */}
        <div className="space-y-6 sm:space-y-8">
          {/* Campus Analytics Card */}
          {stats && (
            <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <CampusAnalyticsCard
                stats={stats}
                loading={loading || false}
              />
            </div>
          )}

          {/* Super Admin Analytics Card */}
          {papers && users && (
            <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-white to-blue-50/80">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Super Admin Analytics</h2>
              </div>
              <div className="p-4 sm:p-6">
                <SuperAdminAnalyticsCard
                  papers={papers}
                  users={users}
                  selectedCollege={selectedCollege}
                  selectedInstitute={selectedInstitute}
                  loading={scopeLoading || false}
                />
              </div>
            </div>
          )}

          {/* Fallback if no data */}
          {!stats && !papers && (
            <div className="bg-white rounded-xl border border-gray-200 p-8 sm:p-12 text-center">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                No Analytics Data Available
              </h3>
              <p className="text-gray-600 mb-6">
                Please navigate from the dashboard to view analytics.
              </p>
              <Button
                onClick={() => navigate(-1)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back to Dashboard
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

