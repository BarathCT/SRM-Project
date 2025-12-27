import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Users, 
  Trophy, 
  TrendingUp, 
  BookOpen,
  Award,
  GraduationCap
} from "lucide-react";

export default function FacultyStatsCard({ facultyData, loading }) {
  if (loading) {
    return (
      <Card className="border border-gray-200 bg-white">
        <CardHeader className="bg-blue-50 border-b border-blue-100">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Users className="h-5 w-5 text-blue-600" />
            Faculty Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-blue-100 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-blue-100 rounded w-3/4"></div>
                  <div className="h-3 bg-blue-100 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const topPerformers = facultyData.slice(0, 10);

  return (
    <Card className="border border-blue-100 shadow-md bg-white">
      <CardHeader className="bg-blue-50 border-b border-blue-100">
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <Users className="h-5 w-5 text-blue-600" />
          Faculty Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {topPerformers.map((faculty, index) => (
              <div 
                key={faculty.facultyId} 
                className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <GraduationCap className="h-6 w-6 text-blue-600" />
                    </div>
                    {index < 3 && (
                      <div className={`absolute -top-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-yellow-500 text-white' :
                        index === 1 ? 'bg-gray-400 text-white' :
                        'bg-yellow-600 text-white'
                      }`}>
                        {index + 1}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{faculty.name}</h4>
                    <p className="text-sm text-gray-600">{faculty.department}</p>
                    <p className="text-xs text-gray-500">{faculty.facultyId}</p>
                  </div>
                </div>
                
                <div className="text-right space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="secondary" 
                      className="bg-blue-100 text-blue-800 font-medium"
                    >
                      <BookOpen className="h-3 w-3 mr-1" />
                      {faculty.totalPapers}
                    </Badge>
                    {faculty.q1Papers > 0 && (
                      <Badge 
                        variant="secondary" 
                        className="bg-yellow-100 text-yellow-800 font-medium"
                      >
                        <Award className="h-3 w-3 mr-1" />
                        Q1: {faculty.q1Papers}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Recent: {faculty.recentPapers}
                    </div>
                    <div className="flex items-center gap-1">
                      <Trophy className="h-3 w-3" />
                      Avg: {faculty.avgQRating}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {facultyData.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No faculty data available</p>
              </div>
            )}
          </div>
        </ScrollArea>
        
        {facultyData.length > 10 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Showing top 10 of {facultyData.length} faculty members
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}