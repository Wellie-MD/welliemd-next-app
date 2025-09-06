import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Edit, Filter, Phone, Eye, Send, Smile, Paperclip } from "lucide-react"
import mockData from "@/data/mockData.json"

const messageFilters = ["All", "Patients", "Doctors", "Support"]

export default function Messages() {
  const [activeFilter, setActiveFilter] = useState("All")
  const [search, setSearch] = useState("")
  const { conversations, activeChat } = mockData.messages

  // 🔎 filter conversations by search + active filter
  const filteredConversations = conversations.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.message.toLowerCase().includes(search.toLowerCase())

    const matchesFilter =
      activeFilter === "All" || c.type === activeFilter.toLowerCase()

    return matchesSearch && matchesFilter
  })

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">
        {/* Messages List */}
        <div className="lg:col-span-1 bg-card rounded-lg border">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold">All Messages</h2>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
              <Button variant="ghost" size="sm"><Filter className="h-4 w-4" /></Button>
            </div>
          </div>
          
          <div className="p-4">
            {/* 🔎 Search input */}
            <Input
              placeholder="Search"
              className="mb-4"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            
            {/* Filter tabs */}
            <div className="flex gap-1 mb-4">
              {messageFilters.map((filter) => (
                <Button
                  key={filter}
                  variant={activeFilter === filter ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveFilter(filter)}
                  className="text-xs"
                >
                  {filter}
                </Button>
              ))}
            </div>
            
            {/* Conversations */}
            <div className="space-y-2">
              {filteredConversations.length > 0 ? (
                filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg cursor-pointer"
                  >
                    <div className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={conversation.avatar} />
                        <AvatarFallback>{conversation.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      {conversation.online && (
                        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-background"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{conversation.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{conversation.message}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">{conversation.time}</div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No conversations found
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat Area (unchanged) */}
        <div className="lg:col-span-2 bg-card rounded-lg border flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar>
                  <AvatarImage src="/api/placeholder/40/40" />
                  <AvatarFallback>{activeChat.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-background"></div>
              </div>
              <div>
                <div className="font-semibold">{activeChat.name}</div>
                <div className="text-sm text-muted-foreground">
                  {activeChat.status} • {activeChat.email}
                </div>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">Online</Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Phone className="h-4 w-4" />
                Call
              </Button>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4" />
                View Profile
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {activeChat.messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === "doctor" ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.sender === "doctor"
                      ? "bg-muted text-foreground"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  <div className="text-sm">{message.message}</div>
                  <div className="text-xs opacity-70 mt-1">{message.time}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Message Input */}
          <div className="p-4 border-t">
            <div className="flex items-center gap-2">
              <Input placeholder="Type your message here..." className="flex-1" />
              <Button variant="ghost" size="sm"><Smile className="h-4 w-4" /></Button>
              <Button variant="ghost" size="sm"><Paperclip className="h-4 w-4" /></Button>
              <Button size="sm" className="gap-2">
                <Send className="h-4 w-4" />
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
