"use client";

import { useEffect, useState } from "react";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, Timestamp } from "firebase/firestore";
import { format } from "date-fns";
import { toast } from "sonner";
import { Plus, Loader2, Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import type { Announcement } from "@/types";

export default function NewsPage() {
  const { firebaseUser } = useAuth();
  const { isStaff } = useRole();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "announcements"), orderBy("publishedAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setAnnouncements(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Announcement));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function handlePublish() {
    if (!firebaseUser || !title || !content) {
      toast.error("Title and content are required");
      return;
    }
    setSubmitting(true);
    try {
      await addDoc(collection(db, "announcements"), {
        title,
        content,
        authorId: firebaseUser.uid,
        publishedAt: serverTimestamp(),
        pinned,
      });
      toast.success("Announcement published");
      setOpen(false);
      setTitle("");
      setContent("");
      setPinned(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to publish");
    } finally {
      setSubmitting(false);
    }
  }

  // Pinned items float to the top regardless of publish date
  const sorted = [...announcements].sort((a, b) => Number(b.pinned) - Number(a.pinned));

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Company News</h1>
          <p className="text-sm text-muted-foreground">Announcements and policy updates</p>
        </div>
        {isStaff && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button size="sm" />}>
              e<Plus className="h-4 w-4 mr-1" /> New Post
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Publish Announcement</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Content</Label>
                  <textarea
                    className="w-full min-h-24 rounded-md border px-3 py-2 text-sm bg-background"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
                  Pin to top
                </label>
              </div>
              <DialogFooter>
                <Button onClick={handlePublish} disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Publish
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">No announcements yet.</p>
      ) : (
        <div className="space-y-3">
          {sorted.map((a) => (
            <Card key={a.id} className={a.pinned ? "border-primary/40" : ""}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  {a.pinned && <Pin className="h-3.5 w-3.5 text-primary" />}
                  {a.title}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {a.publishedAt ? format((a.publishedAt as unknown as Timestamp).toDate(), "MMM d, yyyy") : "—"}
                </p>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{a.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}