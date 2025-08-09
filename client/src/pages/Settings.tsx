import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LocationsSettings } from "@/components/settings/locations-settings";
import { RoomsSettings } from "@/components/settings/rooms-settings";
import { CategoriesSettings } from "@/components/settings/categories-settings";
import { AgeGroupsSettings } from "@/components/settings/age-groups-settings";
import { GeneralSettings } from "@/components/settings/general-settings";
import { MapPin, Building, Tag, Users, ArrowLeft, Settings as SettingsIcon } from "lucide-react";
import { useLocation } from "wouter";

export function Settings() {
  const [, setLocation] = useLocation();

  const handleBackToPlanner = () => {
    setLocation('/');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-4 mb-6">
        <Button 
          variant="ghost" 
          onClick={handleBackToPlanner}
          className="flex items-center gap-2 hover:bg-gray-100"
          data-testid="back-to-planner"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Lesson Planner
        </Button>
      </div>
      
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your organization's locations, rooms, categories, and age groups.
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="locations" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Locations
          </TabsTrigger>
          <TabsTrigger value="rooms" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Rooms
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="age-groups" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Age Groups
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <GeneralSettings tenantId="7cb6c28d-164c-49fa-b461-dfc47a8a3fed" />
        </TabsContent>

        <TabsContent value="locations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Locations Management</CardTitle>
              <CardDescription>
                Manage your physical locations and facilities.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LocationsSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rooms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rooms Management</CardTitle>
              <CardDescription>
                Manage rooms within your locations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RoomsSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Categories Management</CardTitle>
              <CardDescription>
                Organize activities, materials, and milestones with custom categories.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CategoriesSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="age-groups" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Age Groups Management</CardTitle>
              <CardDescription>
                Define age ranges for activities and developmental tracking.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AgeGroupsSettings />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}