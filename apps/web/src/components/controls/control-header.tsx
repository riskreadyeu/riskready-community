"use client";

import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Calendar,
  ChevronDown,
  ClipboardList,
  Download,
  List,
  FileSpreadsheet,
  FileText,
  Plus,
  RefreshCcw,
  Upload,
} from "lucide-react";
import { PageHeader } from "@/components/common";

export function ControlHeader() {
  return (
    <PageHeader
      title="Control Management"
      description="Manage and monitor controls across frameworks, capabilities, and testing programs"
      badge={
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
          <RefreshCcw className="w-3 h-3 mr-1" />
          Live Sync
        </Badge>
      }
      actions={
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="bg-transparent gap-2">
            <Link to="/controls/library">
              <List className="w-4 h-4" />
              View List
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="bg-transparent gap-2">
            <Calendar className="w-4 h-4" />
            Schedule Test
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="bg-transparent gap-2">
                <Download className="w-4 h-4" />
                Export
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                Export to Excel
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <FileText className="w-4 h-4" />
                Export to PDF
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2">
                <ClipboardList className="w-4 h-4" />
                Control Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="gap-2 glow-primary">
                <Plus className="w-4 h-4" />
                New Control
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="gap-2">
                <Plus className="w-4 h-4" />
                Create Control
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <Upload className="w-4 h-4" />
                Import from Framework
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2">
                <ClipboardList className="w-4 h-4" />
                Control from Template
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      }
    />
  );
}
