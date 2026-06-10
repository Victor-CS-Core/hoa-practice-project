import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { useCreateEvent, useEditEvent, useEvent } from "../../hooks/useEvents";
import type { CreateEventFormValues } from "../../types/event";

export function EventFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const { data: eventData } = useEvent(id);
  const createMutation = useCreateEvent();
  const editMutation = useEditEvent();

  const { register, handleSubmit, reset } = useForm<CreateEventFormValues>({
    defaultValues: {
      title: "",
      description: "",
      category: "",
      locationWithinCommunity: "",
      startDate: "",
      endDate: "",
      maxAttendees: undefined,
      imageUrl: "",
    },
  });

  useEffect(() => {
    if (eventData && isEdit) {
      reset({
        title: eventData.title,
        description: eventData.description,
        category: eventData.category,
        locationWithinCommunity: eventData.locationWithinCommunity,
        startDate: eventData.startDate.slice(0, 16),
        endDate: eventData.endDate.slice(0, 16),
        maxAttendees: eventData.maxAttendees ?? undefined,
        imageUrl: eventData.imageUrl ?? "",
      });
    }
  }, [eventData, isEdit, reset]);

  const onSubmit = async (values: CreateEventFormValues) => {
    if (isEdit && id) {
      const updated = await editMutation.mutateAsync({ id, values });
      navigate(`/events/${updated.id}`);
      return;
    }

    const created = await createMutation.mutateAsync(values);
    navigate(`/events/${created.id}`);
  };

  return (
    <section>
      <h2>{isEdit ? "Edit Event" : "Create Event"}</h2>
      <form
        onSubmit={handleSubmit(onSubmit)}
        style={{ display: "grid", gap: 8, maxWidth: 560 }}
      >
        <input placeholder="Title" {...register("title", { required: true })} />
        <textarea
          placeholder="Description"
          {...register("description", { required: true })}
        />
        <input
          placeholder="Category"
          {...register("category", { required: true })}
        />
        <input
          placeholder="Location"
          {...register("locationWithinCommunity", { required: true })}
        />
        <label>
          Start
          <input
            type="datetime-local"
            {...register("startDate", { required: true })}
          />
        </label>
        <label>
          End
          <input
            type="datetime-local"
            {...register("endDate", { required: true })}
          />
        </label>
        <input
          type="number"
          placeholder="Max attendees"
          {...register("maxAttendees", { valueAsNumber: true })}
        />
        <input placeholder="Image URL" {...register("imageUrl")} />
        <button type="submit">
          {isEdit ? "Save Changes" : "Create Event"}
        </button>
      </form>
    </section>
  );
}
