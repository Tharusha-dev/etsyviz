"use client"

import { useEffect, useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { getCookie } from "cookies-next/client"
import SettingsDropdown from "./settings"

interface User {
  id: number
  email: string
  name: string
  is_admin: boolean
  prodaccess: boolean
  storeaccess: boolean
  prodandstoreaccess: boolean
  created_at: string
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([])
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isNewUserDialogOpen, setIsNewUserDialogOpen] = useState(false)
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    isAdmin: false
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:8000/users', {
        headers: {
          auth: `${getCookie("userToken")}`,
        },
      })
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      toast.error("Failed to fetch users")
    }
  }

  const handleUpdateUser = async (user: User) => {
    try {
      const response = await fetch(`http://localhost:8000/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          auth: `${getCookie("userToken")}`,
        },
        body: JSON.stringify(user),
      })
      const updatedUser = await response.json()
      setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u))
      setIsDialogOpen(false)
      toast.success("User updated successfully")
    } catch (error) {
      toast.error("Failed to update user")
    }
  }

  const handleAddUser = async () => {
    try {
      const response = await fetch('http://localhost:8000/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      })
      
      if (!response.ok) {
        throw new Error('Failed to create user')
      }
      
      await fetchUsers() // Refresh the users list
      setIsNewUserDialogOpen(false)
      setNewUser({ name: '', email: '', password: '', isAdmin: false }) // Reset form
      toast.success("User created successfully")
    } catch (error) {
      toast.error("Failed to create user")
    }
  }

  return (
    <div className="container mx-auto py-10">
           <div className="flex justify-end mb-4">
        <SettingsDropdown />  
      </div>
      <div className="flex justify-between items-center mb-[2%]" style={{justifyContent: "space-between"}}>
        <h1 className="text-2xl font-bold">Users Management</h1>
        <Dialog open={isNewUserDialogOpen} onOpenChange={setIsNewUserDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add New User</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label>Name</label>
                <Input
                  className="col-span-3"
                  value={newUser.name}
                  onChange={(e) => setNewUser({
                    ...newUser,
                    name: e.target.value
                  })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label>Email</label>
                <Input
                  className="col-span-3"
                  value={newUser.email}
                  onChange={(e) => setNewUser({
                    ...newUser,
                    email: e.target.value
                  })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label>Password</label>
                <Input
                  className="col-span-3"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({
                    ...newUser,
                    password: e.target.value
                  })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={newUser.isAdmin}
                  onCheckedChange={(checked) => setNewUser({
                    ...newUser,
                    isAdmin: checked as boolean
                  })}
                />
                <label>Admin</label>
              </div>
              <Button onClick={handleAddUser}>
                Create User
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Admin</TableHead>
            <TableHead>Product Access</TableHead>
            <TableHead>Store Access</TableHead>
            <TableHead>Product & Store Access</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.is_admin ? "Yes" : "No"}</TableCell>
              <TableCell>{user.prodaccess ? "Yes" : "No"}</TableCell>
              <TableCell>{user.storeaccess ? "Yes" : "No"}</TableCell>
              <TableCell>{user.prodandstoreaccess ? "Yes" : "No"}</TableCell>
              <TableCell>
                <Dialog open={isDialogOpen && editingUser?.id === user.id} 
                       onOpenChange={(open) => {
                         setIsDialogOpen(open)
                         if (!open) setEditingUser(null)
                       }}>
                  <DialogTrigger asChild>
                    <Button variant="outline" 
                            onClick={() => setEditingUser(user)}>
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit User</DialogTitle>
                    </DialogHeader>
                    {editingUser && (
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <label>Name</label>
                          <Input
                            className="col-span-3"
                            value={editingUser.name}
                            onChange={(e) => setEditingUser({
                              ...editingUser,
                              name: e.target.value
                            })}
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <label>Email</label>
                          <Input
                            className="col-span-3"
                            value={editingUser.email}
                            onChange={(e) => setEditingUser({
                              ...editingUser,
                              email: e.target.value
                            })}
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={editingUser.is_admin}
                            onCheckedChange={(checked) => setEditingUser({
                              ...editingUser,
                              is_admin: checked as boolean
                            })}
                          />
                          <label>Admin</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={editingUser.prodaccess}
                            onCheckedChange={(checked) => setEditingUser({
                              ...editingUser,
                              prodaccess: checked as boolean
                            })}
                          />
                          <label>Product Access</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={editingUser.storeaccess}
                            onCheckedChange={(checked) => setEditingUser({
                              ...editingUser,
                              storeaccess: checked as boolean
                            })}
                          />
                          <label>Store Access</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={editingUser.prodandstoreaccess}
                            onCheckedChange={(checked) => setEditingUser({
                              ...editingUser,
                              prodandstoreaccess: checked as boolean
                            })}
                          />
                          <label>Product & Store Access</label>
                        </div>
                        <Button onClick={() => handleUpdateUser(editingUser)}>
                          Save Changes
                        </Button>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
