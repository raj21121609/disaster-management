import React, { useState } from "react";
import {
  User,
  Heart,
  Briefcase,
  ChevronRight,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Activity
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { Alert } from "../components/ui/Alert";
import { useAuth } from "../contexts/AuthContext";
import { cn } from "../lib/utils";
// import "./AuthPage.css"; // REMOVED

const AuthPage = ({ onNavigate }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [selectedRole, setSelectedRole] = useState("citizen");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, signup } = useAuth();

  const roles = [
    {
      id: "citizen",
      label: "Citizen",
      icon: User,
      desc: "Report & Track",
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      activeBorder: "border-amber-500",
    },
    {
      id: "volunteer",
      label: "Volunteer",
      icon: Heart,
      desc: "Help & Respond",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      activeBorder: "border-emerald-500",
    },
    {
      id: "agency",
      label: "Agency",
      icon: Briefcase,
      desc: "Manage & Dispatch",
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      activeBorder: "border-blue-500",
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      return setError("Please fill in all fields");
    }

    if (password.length < 6) {
      return setError("Password must be at least 6 characters");
    }

    try {
      setError("");
      setLoading(true);

      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password, selectedRole, displayName);
      }

      const navigateTo = selectedRole === "agency" ? "agency" :
        selectedRole === "volunteer" ? "volunteer" : "dashboard";
      onNavigate(navigateTo);

    } catch (err) {
      console.error("Auth error:", err);
      let errorMessage = "Authentication failed";
      // ... existing error handling logic ...
      if (err.code === "auth/email-already-in-use") errorMessage = "This email is already registered";
      else if (err.code === "auth/invalid-email") errorMessage = "Invalid email address";
      else if (err.code === "auth/weak-password") errorMessage = "Password is too weak";
      else if (err.code === "auth/user-not-found") errorMessage = "No account found with this email";
      else if (err.code === "auth/wrong-password") errorMessage = "Incorrect password";
      else if (err.message) errorMessage = err.message;

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-950 px-4 py-8">
      {/* Background decoration */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 -z-10" />

      <Card className="w-full max-w-md border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-slate-800 border border-slate-700 mb-2">
            <Activity className="h-6 w-6 text-red-500" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-white">
            {isLogin ? "System Access" : "Join the Network"}
          </CardTitle>
          <CardDescription className="text-slate-400">
            {isLogin
              ? "Authenticate to access the command terminal."
              : "Register to coordinate in the emergency network."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive" title="Access Denied">
                {error}
              </Alert>
            )}

            {!isLogin && (
              <div className="space-y-4 animate-in slide-in-from-top-4 fade-in duration-300">
                <div className="grid grid-cols-3 gap-2">
                  {roles.map((role) => {
                    const Icon = role.icon;
                    const isSelected = selectedRole === role.id;
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => setSelectedRole(role.id)}
                        className={cn(
                          "flex flex-col items-center justify-center gap-2 rounded-lg border p-3 transition-all hover:bg-slate-800",
                          isSelected
                            ? cn("bg-slate-800 border-2", role.activeBorder)
                            : "border-slate-800 bg-transparent text-slate-500"
                        )}
                      >
                        <Icon className={cn("h-6 w-6", isSelected ? role.color : "text-slate-500")} />
                        <div className="text-center">
                          <div className={cn("text-xs font-semibold", isSelected ? "text-white" : "text-slate-400")}>{role.label}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="display-name">Identity (Optional)</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <Input
                      id="display-name"
                      placeholder="Operative Name"
                      className="pl-9 bg-slate-950/50 border-slate-700 text-slate-200"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email Credential</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="agent@crisis.one"
                  className="pl-9 bg-slate-950/50 border-slate-700 text-slate-200"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Passcode</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-9 pr-9 bg-slate-950/50 border-slate-700 text-slate-200"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full mt-6 bg-blue-600 hover:bg-blue-500 text-white font-bold tracking-wide"
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Activity className="h-4 w-4 animate-spin" /> ESTABLISHING LINK...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {isLogin ? "AUTHENTICATE" : "REGISTER PROFILE"} <ChevronRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter>
          <div className="w-full text-center space-y-4">
            <div className="text-sm text-slate-400">
              {isLogin ? "New operative?" : "Already verified?"} {" "}
              <button
                type="button"
                onClick={() => { setIsLogin(!isLogin); setError(""); }}
                className="text-blue-400 hover:text-blue-300 font-semibold hover:underline underline-offset-4"
              >
                {isLogin ? "Initialize Registration" : "Access Terminal"}
              </button>
            </div>

            <div className="text-[10px] text-slate-600 font-mono border-t border-slate-800 pt-4">
              SECURE CONNECTION :: ENCRYPTED :: V 2.4.0
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AuthPage;
