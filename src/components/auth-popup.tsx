"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogIn, UserPlus, Heart, Bookmark, MessageCircle } from "lucide-react";

interface AuthPopupProps {
  isOpen: boolean;
  onClose: () => void;
  action?: "like" | "bookmark" | "comment";
  title?: string;
}

export function AuthPopup({ 
  isOpen, 
  onClose, 
  action = "like",
  title 
}: AuthPopupProps) {
  const router = useRouter();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  const getActionIcon = () => {
    switch (action) {
      case "like":
        return <Heart className="w-8 h-8 text-red-500" />;
      case "bookmark":
        return <Bookmark className="w-8 h-8 text-blue-500" />;
      case "comment":
        return <MessageCircle className="w-8 h-8 text-green-500" />;
      default:
        return <Heart className="w-8 h-8 text-red-500" />;
    }
  };

  const getActionText = () => {
    switch (action) {
      case "like":
        return "like posts";
      case "bookmark":
        return "bookmark posts";
      case "comment":
        return "comment on posts";
      default:
        return "interact with posts";
    }
  };

  const handleLogin = () => {
    onClose();
    router.push("/login");
  };

  const handleSignup = () => {
    onClose();
    router.push("/signup");
  };

  // Don't show popup if user is already authenticated
  if (isAuthenticated) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {title || "Join the Community"}
          </DialogTitle>
          <DialogDescription className="text-center">
            Sign in to unlock all features
          </DialogDescription>
        </DialogHeader>

        <Card className="p-6 border-0 shadow-none">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center justify-center w-16 h-16 bg-muted rounded-full">
              {getActionIcon()}
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-lg">
                Sign in to {getActionText()}
              </h3>
              <p className="text-sm text-muted-foreground">
                Join our community to engage with content, save your favorites, and connect with other members.
              </p>
            </div>

            <div className="flex flex-col w-full space-y-3 pt-4">
              <Button onClick={handleLogin} className="w-full" size="lg">
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Button>
              
              <Button 
                onClick={handleSignup} 
                variant="outline" 
                className="w-full" 
                size="lg"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Create Account
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center pt-2">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </Card>
      </DialogContent>
    </Dialog>
  );
}