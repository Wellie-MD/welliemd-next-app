import { useState } from "react";
import { Send, Search, Plus, Paperclip, Phone, Video } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";

interface Message {
  id: number;
  sender: string;
  content: string;
  timestamp: string;
  isFromDoctor: boolean;
  read: boolean;
}

interface Conversation {
  id: number;
  doctor: string;
  specialty: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  avatar?: string;
}

export default function Messages() {
  const [selectedConversation, setSelectedConversation] = useState<number>(1);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const conversations: Conversation[] = [
    {
      id: 1,
      doctor: "Dr. Sarah Johnson",
      specialty: "Cardiology",
      lastMessage: "Your test results look good. Let's schedule a follow-up.",
      timestamp: "2 hours ago",
      unread: 2
    },
    {
      id: 2,
      doctor: "Dr. Michael Chen",
      specialty: "Dermatology",
      lastMessage: "Apply the cream twice daily as discussed.",
      timestamp: "1 day ago",
      unread: 0
    },
    {
      id: 3,
      doctor: "Dr. Emily Rodriguez",
      specialty: "Primary Care",
      lastMessage: "Please upload your blood pressure readings.",
      timestamp: "3 days ago",
      unread: 1
    }
  ];

  const messages: Message[] = [
    {
      id: 1,
      sender: "Dr. Sarah Johnson",
      content: "Hello John! I've reviewed your latest ECG results and they look very promising.",
      timestamp: "10:30 AM",
      isFromDoctor: true,
      read: true
    },
    {
      id: 2,
      sender: "You",
      content: "That's great to hear! I've been following the diet plan you recommended.",
      timestamp: "10:45 AM",
      isFromDoctor: false,
      read: true
    },
    {
      id: 3,
      sender: "Dr. Sarah Johnson",
      content: "Excellent! Your cholesterol levels have improved significantly. Let's schedule a follow-up appointment in 3 months.",
      timestamp: "11:00 AM",
      isFromDoctor: true,
      read: true
    },
    {
      id: 4,
      sender: "Dr. Sarah Johnson",
      content: "I'll also send you some additional resources about heart-healthy exercises.",
      timestamp: "11:02 AM",
      isFromDoctor: true,
      read: false
    }
  ];

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // Here you would typically send the message to your backend
      setNewMessage("");
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.doctor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.specialty.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Messages</h1>
          <p className="text-gray-600">Communicate with your healthcare providers</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Message
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">
        {/* Conversations List */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search conversations..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 border-l-4 ${
                    selectedConversation === conversation.id
                      ? "bg-blue-50 border-blue-500"
                      : "border-transparent"
                  }`}
                  onClick={() => setSelectedConversation(conversation.id)}
                >
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={conversation.avatar} />
                      <AvatarFallback>
                        {conversation.doctor.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900 truncate">
                          {conversation.doctor}
                        </p>
                        {conversation.unread > 0 && (
                          <Badge variant="destructive" className="ml-2 h-5 w-5 text-xs">
                            {conversation.unread}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{conversation.specialty}</p>
                      <p className="text-sm text-gray-500 truncate mt-1">
                        {conversation.lastMessage}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{conversation.timestamp}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Message Thread */}
        <Card className="lg:col-span-2 flex flex-col">
          {selectedConv && (
            <>
              {/* Chat Header */}
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedConv.avatar} />
                      <AvatarFallback>
                        {selectedConv.doctor.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium text-gray-900">{selectedConv.doctor}</h3>
                      <p className="text-sm text-gray-600">{selectedConv.specialty}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Video className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Separator />
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto p-0">
                <div className="p-6 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isFromDoctor ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.isFromDoctor
                            ? 'bg-gray-100 text-gray-900'
                            : 'bg-blue-600 text-white'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            message.isFromDoctor ? 'text-gray-500' : 'text-blue-100'
                          }`}
                        >
                          {message.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>

              {/* Message Input */}
              <div className="p-6 border-t">
                <div className="flex items-end space-x-2">
                  <div className="flex-1">
                    <Textarea
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Button variant="outline" size="sm">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button onClick={handleSendMessage} size="sm">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}