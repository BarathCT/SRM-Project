import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import CampusAnalyticsCard from "../CampusAdminDashboard/components/CampusAnalyticsCard";
import SuperAdminAnalyticsCard from "../SuperAdminDashboard/components/SuperAdminAnalyticsCard";

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get data from location state or fetch it
  const { stats, papers, users, selectedCollege, selectedInstitute, loading, scopeLoading } = location.state || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header with Back Button */}
        <div className="mb-6 sm:mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-4 sm:mb-6 text-blue-700 hover:text-blue-800 hover:bg-blue-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
              <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                Analytics Overview
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                Comprehensive insights into publication metrics and trends
              </p>
            </div>
          </div>
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
              <SuperAdminAnalyticsCard
                papers={papers}
                users={users}
                selectedCollege={selectedCollege}
                selectedInstitute={selectedInstitute}
                loading={scopeLoading || false}
              />
            </div>
          )}

          {/* Fallback if no data */}
          {!stats && !papers && (
            <div className="bg-white rounded-xl border border-gray-200 p-8 sm:p-12 text-center">
              <BarChart3 className="h-16 w-16 sm:h-20 sm:w-20 text-gray-300 mx-auto mb-4" />
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

