'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Check, X, Shield, Lock, RefreshCw, AlertCircle } from 'lucide-react';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchPending = async () => {
    try {
      const res = await fetch('/api/admin/pending-fees');
      const data = await res.json();
      if (data?.pending) {
        setPendingChanges(data.pending);
      }
    } catch {
      setError('Failed to fetch pending fees');
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim().length > 0) {
      setIsAuthenticated(true);
      setError(null);
    }
  };

  const handleAction = async (changeId: string, action: 'approve' | 'reject') => {
    setLoading(true);
    setError(null);
    setActionSuccess(null);

    try {
      const res = await fetch('/api/admin/pending-fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, changeId, action }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Action failed');
      }

      setActionSuccess(`Successfully ${action}ed change.`);
      if (action === 'approve' && data.updatedItem) {
        useStore.getState().updateItem(data.updatedItem.itemId, {
          default: data.updatedItem.proposedValue,
          estimate: data.updatedItem.proposedValue,
          lastVerified: data.updatedItem.lastVerified,
        });
      }
      setPendingChanges((prev) => prev.filter((p) => p.id !== changeId));
    } catch (err: any) {
      setError(err.message || 'Action failed. Check password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Planner
          </Link>

          <Badge variant="outline" className="font-mono text-xs">
            Admin Console
          </Badge>
        </div>

        {/* Auth gate */}
        {!isAuthenticated ? (
          <Card className="max-w-md mx-auto shadow-md">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Admin Authentication
              </CardTitle>
              <CardDescription className="text-xs">
                Enter your administrative password (configured in environment variables).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Input
                    type="password"
                    placeholder="Enter admin password (default: germany2026)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="font-mono"
                    required
                  />
                </div>
                <Button type="submit" className="w-full text-xs">
                  <Lock className="h-3.5 w-3.5 mr-1.5" />
                  Access Dashboard
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Shield className="h-5 w-5 text-emerald-600" />
                    Pending Fee Modifications
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Automated cron scrapes never silently overwrite costs. Approve or reject detected changes below.
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={fetchPending}
                  className="h-8 w-8 text-muted-foreground"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </CardHeader>

              <CardContent className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {actionSuccess && (
                  <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">
                    <Check className="h-4 w-4 shrink-0" />
                    <span>{actionSuccess}</span>
                  </div>
                )}

                {pendingChanges.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Check className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                    <p className="font-medium text-sm">All fees are verified and up-to-date</p>
                    <p className="text-xs mt-1">No pending rate or fee change proposals detected.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingChanges.map((change) => (
                      <div
                        key={change.id}
                        className="p-4 rounded-xl border bg-card/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{change.label}</span>
                            <Badge variant="outline" className="text-[10px] font-mono">
                              {change.itemId}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground line-through font-mono">
                              {change.currentValue} {change.currency}
                            </span>
                            <span>→</span>
                            <span className="font-bold text-primary font-mono">
                              {change.proposedValue} {change.currency}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            Source: {change.source} • Detected: {new Date(change.detectedAt).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleAction(change.id, 'reject')}
                            disabled={loading}
                            className="text-xs h-8"
                          >
                            <X className="h-3.5 w-3.5 mr-1" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleAction(change.id, 'approve')}
                            disabled={loading}
                            className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <Check className="h-3.5 w-3.5 mr-1" />
                            Approve & Update
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
