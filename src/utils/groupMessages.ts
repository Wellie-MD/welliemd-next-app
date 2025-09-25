export function groupMessages(messages: Message[]): Conversation[] {
  const map = new Map<string, Conversation>();

  messages.forEach((msg) => {
    const key = msg.master_id;   // 👈 group only by master_id

    // fallback patient name
    const safePatientName =
      msg.patientName && msg.patientName.trim() !== ""
        ? msg.patientName
        : msg.senderType === "patient"
        ? msg.sender_name.split("@")[0]
        : "";

    const safePatientEmail =
      msg.senderType === "patient" ? msg.sender_name : "";

    if (!map.has(key)) {
      map.set(key, {
        id: key,
        masterId: msg.master_id,
        patientName: safePatientName,
        patientEmail: safePatientEmail,
        lastMessage: msg.content,
        lastTime: msg.created_at,
        messages: [msg],
      });
    } else {
      const conv = map.get(key)!;
      conv.messages.push(msg);
      if (new Date(msg.created_at) > new Date(conv.lastTime)) {
        conv.lastMessage = msg.content;
        conv.lastTime = msg.created_at;
      }
    }
  });

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime()
  );
}
