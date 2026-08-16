"use client";

import { useEffect, useState } from "react";
import { collection, addDoc, doc, updateDoc, arrayUnion, arrayRemove, query, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { format, isFuture } from "date-fns";
import { toast } from "sonner";
import { Plus, Loader2, CalendarDays, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import type { CompanyEvent } from "@/types";

// RSVP list stored as a subfield alongside the event doc
interface EventWithRsvp extends CompanyEvent {
  rsvpIds?: string[];
}

export default function EventsPage() {
  const { firebaseUser } = useAuth();
  const { isStaff } = useRole();
  const [events, setEvents] = useState<EventWithRsvp[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    const q = query(collection(db, "events"), orderBy("eventDate", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as EventWithRsvp));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function handleCreate() {
    if (!firebaseUser || !title || !eventDate) {
      toast.error("Title and date are required");
      return;
    }
    setSubmitting(true);
    try {
      await addDoc(collection(db, "events"), {
        title,
        description,
        eventDate: Timestamp.fromDate(new Date(eventDate)),
        location,
        targetRoles: [], // empty = visible to all roles
        createdById: firebaseUser.uid,
        rsvpIds: [],
      });
      toast.success("Event created");
      setOpen(false);
      setTitle("");
      setDescription("");
      setEventDate("");
      setLocation("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create event");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleRsvp(event: EventWithRsvp) {
    if (!firebaseUser) return;
    const going = event.rsvpIds?.includes(firebaseUser.uid);
    try {
      await updateDoc(doc(db, "events", event.id), {
        rsvpIds: going ? arrayRemove(firebaseUser.uid) : arrayUnion(firebaseUser.uid),
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update RSVP");
    }
  }

  const upcoming = events.filter((e) => isFuture((e.eventDate as unknown as Timestamp).toDate()));
  const past = events.filter((e) => !isFuture((e.eventDate as unknown as Timestamp).toDate()));

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Events Calendar</h1>
          <p className="text-sm text-muted-foreground">Company events and RSVP tracking</p>
        </div>
        {isStaff && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button size="sm" />}>
              <Plus className="h-4 w-4 mr-1" /> New Event
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Event</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Description</Label>
                  <Input value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Date & Time</Label>
                  <Input type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Location</Label>
                  <Input value={location} onChange={(e) => setLocation(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreate} disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : (
        <>
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Upcoming</p>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming events.</p>
            ) : (
              upcoming.map((e) => {
                const going = firebaseUser && e.rsvpIds?.includes(firebaseUser.uid);
                return (
                  <Card key={e.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        {e.title}
                      </CardTitle>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
                        <span>{format((e.eventDate as unknown as Timestamp).toDate(), "MMM d, yyyy · h:mm a")}</span>
                        {e.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {e.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" /> {e.rsvpIds?.length ?? 0} going
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">{e.description}</p>
                      <Button size="sm" variant={going ? "default" : "outline"} onClick={() => toggleRsvp(e)}>
                        {going ? "Going ✓" : "RSVP"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {past.length > 0 && (
            <div className="space-y-3 pt-2">
              <p className="text-sm font-medium text-muted-foreground">Past</p>
              {past.map((e) => (
                <Card key={e.id} className="opacity-60">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{e.title}</CardTitle>
                    <Badge variant="secondary" className="w-fit mt-1">
                      {format((e.eventDate as unknown as Timestamp).toDate(), "MMM d, yyyy")}
                    </Badge>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}