import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { 
  Crown, 
  Users, 
  Database, 
  Settings, 
  Shield, 
  Activity,
  UserCheck,
  Calendar,
  Trash2,
  Edit3,
  ArrowLeft,
  Sword,
  Star
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { AdminProfilePicture } from "@/components/admin-profile-picture";
import { CourseTourVideoManager } from "@/components/course-tour-video-manager";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Admin() {
  const { user, sessionId } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [videoManagerOpen, setVideoManagerOpen] = useState(false);

  // Role update mutation (Emperor only)
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}/role`, { role }, {
        Authorization: `Bearer ${sessionId}`,
      });
      return res.json();
    },
    onSuccess: () => {
      window.location.reload();
      toast({
        title: "Role Updated",
        description: "User role has been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user role",
        variant: "destructive",
      });
    },
  });

  // Delete user mutation (Emperor only)
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("DELETE", `/api/admin/users/${userId}`, undefined, {
        Authorization: `Bearer ${sessionId}`,
      });
      return res.json();
    },
    onSuccess: () => {
      window.location.reload();
      toast({
        title: "User Deleted",
        description: "User has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  // Delete game mutation
  const deleteGameMutation = useMutation({
    mutationFn: async (gameId: number) => {
      const res = await apiRequest("DELETE", `/api/admin/games/${gameId}`, undefined, {
        Authorization: `Bearer ${sessionId}`,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/games"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/games/completed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/games"] });
      toast({
        title: "Game Deleted",
        description: "Game has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete game",
        variant: "destructive",
      });
    },
  });

  // Delete all games mutation
  const deleteAllGamesMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/admin/games", undefined, {
        Authorization: `Bearer ${sessionId}`,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/games"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/games/completed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/games"] });
      toast({
        title: "All Games Deleted",
        description: "All games have been successfully deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete all games",
        variant: "destructive",
      });
    },
  });

  // Redirect if not Jedi Master or Emperor
  if (!user || (user.role !== 'jedi_master' && user.role !== 'emperor')) {
    navigate("/profile");
    return null;
  }

  // Fetch admin data
  const { data: adminStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/stats", undefined, {
        Authorization: `Bearer ${sessionId}`,
      });
      return await res.json();
    },
    enabled: !!sessionId,
  });

  const { data: allUsers, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/users", undefined, {
        Authorization: `Bearer ${sessionId}`,
      });
      return await res.json();
    },
    enabled: !!sessionId,
  });

  const { data: allGames, isLoading: gamesLoading } = useQuery({
    queryKey: ["/api/admin/games"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/games", undefined, {
        Authorization: `Bearer ${sessionId}`,
      });
      return await res.json();
    },
    enabled: !!sessionId,
  });

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {user.role === 'emperor' ? (
                  <Crown className="w-5 h-5 text-yellow-600" />
                ) : (
                  <Sword className="w-5 h-5 text-blue-600" />
                )}
                {user.role === 'emperor' ? 'Emperor Command Center' : 'Jedi Master Dashboard'}
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate("/profile")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Profile
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-4">
              <Badge variant={user.role === 'emperor' ? 'outline' : 'default'} className={`text-sm ${user.role === 'emperor' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-blue-500 bg-blue-50 text-blue-700'}`}>
                {user.role === 'emperor' ? (
                  <span className="flex items-center gap-1">
                    <img src="/_starwarsq.gif" alt="Emperor" className="w-4 h-4" />
                    Emperor
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <img src="/starwars___q.gif" alt="Jedi Master" className="w-4 h-4" />
                    Jedi Master
                  </span>
                )}
              </Badge>
              <span className="text-sm text-gray-600">
                Welcome, {user.firstName}. {user.role === 'emperor' 
                  ? 'You have unlimited power across the galaxy.' 
                  : 'You have mastery over the Force.'
                }
              </span>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 text-center">
                <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-600">
                  {statsLoading ? "..." : adminStats?.totalUsers || 0}
                </p>
                <p className="text-sm text-blue-600">Total Users</p>
              </div>
              
              <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4 text-center">
                <Activity className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600">
                  {statsLoading ? "..." : adminStats?.activeGames || 0}
                </p>
                <p className="text-sm text-green-600">Active Games</p>
              </div>
              
              <div className="bg-purple-50 dark:bg-purple-950 rounded-lg p-4 text-center">
                <Calendar className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-600">
                  {statsLoading ? "..." : adminStats?.totalGames || 0}
                </p>
                <p className="text-sm text-purple-600">Total Games</p>
              </div>
              
              <div className="bg-orange-50 dark:bg-orange-950 rounded-lg p-4 text-center">
                <Database className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-orange-600">
                  {statsLoading ? "..." : adminStats?.totalPhotos || 0}
                </p>
                <p className="text-sm text-orange-600">Photos Uploaded</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin Tabs */}
        <Card>
          <CardContent className="p-6">
            <Tabs defaultValue="users" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="users" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Users
                </TabsTrigger>
                <TabsTrigger value="games" className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Games
                </TabsTrigger>
                <TabsTrigger value="system" className="flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  System
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Settings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="users" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">User Management</h3>
                  <Button size="sm" variant="outline">
                    <UserCheck className="w-4 h-4 mr-2" />
                    Export Users
                  </Button>
                </div>
                
                {usersLoading ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Loading users...</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {allUsers?.map((userInList: any) => (
                      <div key={userInList.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <AdminProfilePicture 
                            user={{
                              id: userInList.id,
                              firstName: userInList.firstName,
                              lastName: userInList.lastName,
                              profilePicture: userInList.profilePicture
                            }}
                            size="md"
                          />
                          <div>
                            <p className="font-medium">{userInList.firstName} {userInList.lastName}</p>
                            <p className="text-sm text-gray-500">{userInList.phoneNumber}</p>
                          </div>
                          <Badge 
                            variant="outline"
                            className={`text-xs ${
                              userInList.role === 'emperor' ? 'border-purple-500 bg-purple-50 text-purple-700' : 
                              userInList.role === 'jedi_master' ? 'border-blue-500 bg-blue-50 text-blue-700' : 
                              'border-amber-500 bg-amber-50 text-amber-700'
                            }`}
                          >
                            {userInList.role === 'emperor' ? (
                              <span className="flex items-center gap-1">
                                <img src="/_starwarsq.gif" alt="Emperor" className="w-3 h-3" />
                                Emperor
                              </span>
                            ) : userInList.role === 'jedi_master' ? (
                              <span className="flex items-center gap-1">
                                <img src="/starwars___q.gif" alt="Jedi Master" className="w-3 h-3" />
                                Jedi Master
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <img src="/star-wars_rebel-pilot.gif" alt="Jedi" className="w-3 h-3" />
                                Jedi
                              </span>
                            )}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Emperor only: Delete user functionality */}
                          {user.role === 'emperor' && userInList.role !== 'emperor' && (
                            <>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete User</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete {userInList.firstName} {userInList.lastName}? 
                                      This action cannot be undone and will permanently remove all their data including games and scores.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteUserMutation.mutate(userInList.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                      disabled={deleteUserMutation.isPending}
                                    >
                                      {deleteUserMutation.isPending ? "Deleting..." : "Delete User"}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                              {/* Role management */}
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  const newRole = userInList.role === 'jedi_master' ? 'jedi' : 'jedi_master';
                                  updateRoleMutation.mutate({ userId: userInList.id, role: newRole });
                                }}
                                disabled={updateRoleMutation.isPending}
                              >
                                <Shield className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="games" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Game Management</h3>
                  <div className="flex items-center gap-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete All Games
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete All Games</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete ALL games? This action cannot be undone and will permanently remove all games, scores, players, and photos from the database.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteAllGamesMutation.mutate()}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={deleteAllGamesMutation.isPending}
                          >
                            {deleteAllGamesMutation.isPending ? "Deleting..." : "Delete All Games"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <Button size="sm" variant="outline">
                      <Calendar className="w-4 h-4 mr-2" />
                      Export Games
                    </Button>
                  </div>
                </div>
                
                {gamesLoading ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Loading games...</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {allGames?.slice(0, 10).map((game: any) => (
                      <div key={game.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">Game #{game.code}</p>
                          <p className="text-sm text-gray-500">
                            {game.courseType} • {game.players?.length || 0} players • 
                            Status: <span className="capitalize">{game.status}</span>
                          </p>
                          <p className="text-xs text-gray-400">
                            Created: {new Date(game.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={game.status === 'completed' ? 'default' : 'secondary'}>
                            {game.status}
                          </Badge>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Game</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete Game #{game.code}? This action cannot be undone and will permanently remove all associated scores, players, and photos.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteGameMutation.mutate(game.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                  disabled={deleteGameMutation.isPending}
                                >
                                  {deleteGameMutation.isPending ? "Deleting..." : "Delete Game"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="system" className="space-y-4">
                <h3 className="text-lg font-semibold">System Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Database Status</h4>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Connected</span>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Server Status</h4>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Online</span>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Storage Usage</h4>
                    <p className="text-sm text-gray-600">Photo uploads functioning</p>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Weather Service</h4>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Active</span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <h3 className="text-lg font-semibold">Application Settings</h3>
                
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Course Configuration</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Manage course settings, hole configurations, and game types.
                    </p>
                    <Button size="sm" variant="outline">
                      <Settings className="w-4 h-4 mr-2" />
                      Configure Course
                    </Button>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Weather Settings</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Configure weather service and location settings.
                    </p>
                    <Button size="sm" variant="outline">
                      <Settings className="w-4 h-4 mr-2" />
                      Weather Config
                    </Button>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Maintenance Mode</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Enable maintenance mode to perform system updates.
                    </p>
                    <Button size="sm" variant="outline">
                      <Shield className="w-4 h-4 mr-2" />
                      Maintenance Settings
                    </Button>
                  </div>
                </div>
                
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Course Tour Video</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Manage the video shown when users click "Watch Course Tour".
                    </p>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setVideoManagerOpen(true)}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Manage Videos
                    </Button>
                  </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Video Management Modal */}
        <Dialog open={videoManagerOpen} onOpenChange={setVideoManagerOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Course Tour Video Management</DialogTitle>
            </DialogHeader>
            <CourseTourVideoManager userRole={user.role} />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}