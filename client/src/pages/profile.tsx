import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { User, Phone, Lock, LogOut, History, UserPlus, LogIn, Trophy } from "lucide-react";
import type { ChangePassword, LoginPhone, ResetPassword } from "@shared/schema";
import { changePasswordSchema, loginPhoneSchema, resetPasswordSchema, verifyCodeSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { formatScore, getScoreColor } from "@/lib/utils";
import { COURSE_CONFIG } from "@shared/schema";
import { ProfilePictureUpload } from "@/components/profile-picture-upload";

export default function Profile() {
  const { 
    user, 
    isGuest, 
    sessionId,
    changePasswordMutation, 
    sendPasswordResetMutation, 
    resetPasswordMutation,
    logoutMutation 
  } = useAuth();
  
  const [, navigate] = useLocation();
  const [resetStep, setResetStep] = useState<"request" | "verify">("request");
  const [resetPhone, setResetPhone] = useState("");

  const changePasswordForm = useForm<ChangePassword>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
    },
  });

  const resetRequestForm = useForm<LoginPhone>({
    resolver: zodResolver(loginPhoneSchema),
    defaultValues: {
      phoneNumber: "",
    },
  });

  const resetVerifyForm = useForm<ResetPassword>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      phoneNumber: "",
      code: "",
      newPassword: "",
    },
  });

  // Get user's past games
  const { data: userGames, isLoading: gamesLoading } = useQuery({
    queryKey: ["/api/auth/games"],
    queryFn: async () => {
      if (!sessionId || isGuest) return [];
      const res = await apiRequest("GET", "/api/auth/games", undefined, {
        Authorization: `Bearer ${sessionId}`,
      });
      return await res.json();
    },
    enabled: !!sessionId && !isGuest,
  });

  const onChangePassword = (data: ChangePassword) => {
    changePasswordMutation.mutate(data, {
      onSuccess: () => {
        changePasswordForm.reset();
      },
    });
  };

  const onRequestReset = (data: LoginPhone) => {
    sendPasswordResetMutation.mutate(data, {
      onSuccess: () => {
        setResetPhone(data.phoneNumber);
        resetVerifyForm.setValue("phoneNumber", data.phoneNumber);
        setResetStep("verify");
      },
    });
  };

  const onVerifyReset = (data: ResetPassword) => {
    resetPasswordMutation.mutate(data, {
      onSuccess: () => {
        setResetStep("request");
        resetRequestForm.reset();
        resetVerifyForm.reset();
      },
    });
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Card>
          <CardContent className="p-6 text-center">
            <User className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold mb-2">Not Logged In</h2>
            <p className="text-gray-600 mb-4">Please log in to view your profile</p>
            <Button onClick={() => window.location.href = "/"}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isGuest) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Guest Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-sm font-medium text-gray-500">Name</Label>
              <p className="text-lg font-semibold">{user.firstName}</p>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <UserPlus className="w-5 h-5 text-yellow-600" />
                <h3 className="font-semibold text-yellow-800">Playing as Guest</h3>
              </div>
              <p className="text-yellow-700 text-sm mb-3">
                You're currently playing as a guest. Your game progress won't be saved permanently.
              </p>
              <div className="flex gap-2">
                <Button size="sm" className="bg-golf-green hover:bg-golf-green/90">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create Account
                </Button>
                <Button size="sm" variant="outline">
                  <LogIn className="w-4 h-4 mr-2" />
                  Log In
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center">
              <ProfilePictureUpload
                currentPicture={user.profilePicture || undefined}
                userName={`${user.firstName} ${user.lastName}`}
                size="lg"
              />
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">First Name</Label>
                <p className="text-lg font-semibold">{user.firstName}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Last Name</Label>
                <p className="text-lg font-semibold">{user.lastName}</p>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-500">Phone Number</Label>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <p className="text-lg font-mono">{user.phoneNumber}</p>
                <Badge variant="secondary" className="text-xs">Read-only</Badge>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-500">Role</Label>
              <div className="flex items-center gap-2">
                {user.role === 'emperor' ? (
                  <Badge 
                    variant="outline" 
                    className="text-sm capitalize cursor-pointer border-purple-500 bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
                    onClick={() => navigate("/admin")}
                  >
                    <span className="flex items-center gap-2">
                      <img src="/_starwarsq.gif" alt="Emperor" className="w-4 h-4" />
                      Emperor
                    </span>
                  </Badge>
                ) : user.role === 'jedi_master' ? (
                  <Badge 
                    variant="outline" 
                    className="text-sm capitalize cursor-pointer border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                    onClick={() => navigate("/admin")}
                  >
                    <span className="flex items-center gap-2">
                      <img src="/starwars___q.gif" alt="Jedi Master" className="w-4 h-4" />
                      Jedi Master
                    </span>
                  </Badge>
                ) : (
                  <Badge 
                    variant="outline" 
                    className="text-sm capitalize border-amber-500 bg-amber-50 text-amber-700"
                  >
                    <span className="flex items-center gap-2">
                      <img src="/star-wars_rebel-pilot.gif" alt="Jedi" className="w-4 h-4" />
                      Jedi
                    </span>
                  </Badge>
                )}
              </div>
            </div>

            <Separator />

            <div className="flex justify-end">
              <Button 
                variant="outline" 
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                <LogOut className="w-4 h-4 mr-2" />
                {logoutMutation.isPending ? "Logging Out..." : "Log Out"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="change-password">
              <TabsList>
                <TabsTrigger value="change-password">Change Password</TabsTrigger>
                <TabsTrigger value="reset-password">Reset Password</TabsTrigger>
              </TabsList>

              <TabsContent value="change-password" className="mt-4">
                <Form {...changePasswordForm}>
                  <form onSubmit={changePasswordForm.handleSubmit(onChangePassword)} className="space-y-4">
                    <FormField
                      control={changePasswordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={changePasswordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={changePasswordMutation.isPending}
                    >
                      {changePasswordMutation.isPending ? "Updating..." : "Update Password"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="reset-password" className="mt-4">
                {resetStep === "request" ? (
                  <Form {...resetRequestForm}>
                    <form onSubmit={resetRequestForm.handleSubmit(onRequestReset)} className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <p className="text-blue-700 text-sm">
                          If you've forgotten your password, enter your phone number and we'll send you a reset code.
                        </p>
                      </div>

                      <FormField
                        control={resetRequestForm.control}
                        name="phoneNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="+1234567890" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        disabled={sendPasswordResetMutation.isPending}
                      >
                        {sendPasswordResetMutation.isPending ? "Sending..." : "Send Reset Code"}
                      </Button>
                    </form>
                  </Form>
                ) : (
                  <Form {...resetVerifyForm}>
                    <form onSubmit={resetVerifyForm.handleSubmit(onVerifyReset)} className="space-y-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                        <p className="text-green-700 text-sm">
                          Enter the verification code sent to {resetPhone} and your new password.
                        </p>
                      </div>

                      <FormField
                        control={resetVerifyForm.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Verification Code</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="123456" 
                                maxLength={6}
                                className="text-center text-lg tracking-wider"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={resetVerifyForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-2">
                        <Button
                          type="submit"
                          disabled={resetPasswordMutation.isPending}
                        >
                          {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setResetStep("request")}
                        >
                          Back
                        </Button>
                      </div>
                    </form>
                  </Form>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Game History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {gamesLoading ? (
              <div className="text-center py-4">
                <p className="text-gray-500">Loading games...</p>
              </div>
            ) : !userGames || userGames.length === 0 ? (
              <div className="text-center py-8">
                <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">No Games Yet</h3>
                <p className="text-gray-600">Your completed games will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {userGames.map((game: any) => {
                  const courseConfig = COURSE_CONFIG[game.courseType as keyof typeof COURSE_CONFIG];
                  const userPlayer = game.players.find((p: any) => p.userId === user.id);
                  const userScores = game.scores.filter((s: any) => s.playerId === userPlayer?.id);
                  const totalStrokes = userScores.reduce((sum: number, score: any) => sum + score.strokes, 0);
                  const totalPar = courseConfig.pars.slice(0, userScores.length).reduce((sum: number, par: number) => sum + par, 0);
                  const relativeToPar = totalStrokes - totalPar;

                  return (
                    <div key={game.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold">{game.courseType.replace(/(\d+)/, ' $1').replace(/^./, (str: string) => str.toUpperCase())}</h4>
                          <p className="text-sm text-gray-500">
                            {new Date(game.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${getScoreColor(totalStrokes, totalPar)}`}>
                            {formatScore(totalStrokes, totalPar)}
                          </div>
                          <p className="text-sm text-gray-500">{totalStrokes} strokes</p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>{userScores.length} of {courseConfig.holes} holes completed</p>
                        <p>{game.players.length} players</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}