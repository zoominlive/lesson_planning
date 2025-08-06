import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LocationsSettings } from "@/components/settings/locations-settings";
import { RoomsSettings } from "@/components/settings/rooms-settings";
import { CategoriesSettings } from "@/components/settings/categories-settings";
import { AgeGroupsSettings } from "@/components/settings/age-groups-settings";
import { MapPin, Building, Tag, Users } from "lucide-react";

export function Settings() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your organization's locations, rooms, categories, and age groups.
        </p>
      </div>

      <Tabs defaultValue="locations" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
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