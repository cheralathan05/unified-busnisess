export class ActivityDTO {
  static toResponse(activity: any) {
    return {
      id: activity.id,
      type: activity.type,
      note: activity.text ?? null,
      status: activity.status ?? null,
      leadId: activity.leadId,
      createdAt: activity.createdAt
    };
  }

  static toList(activities: any[]) {
    return activities.map(this.toResponse);
  }
}