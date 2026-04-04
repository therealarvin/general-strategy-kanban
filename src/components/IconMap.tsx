'use client';

import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Zap,
  Key,
  Lock,
  Link,
  FileText,
  Server,
  Paperclip,
} from 'lucide-react';
import { ComponentProps } from 'react';

type LucideProps = ComponentProps<typeof ArrowDown>;

const iconMap: Record<string, React.ComponentType<LucideProps>> = {
  'arrow-down': ArrowDown,
  'arrow-right': ArrowRight,
  'arrow-up': ArrowUp,
  'zap': Zap,
  'key': Key,
  'lock': Lock,
  'link': Link,
  'file-text': FileText,
  'server': Server,
  'paperclip': Paperclip,
};

interface IconMapProps extends LucideProps {
  name: string;
}

export default function IconMap({ name, ...props }: IconMapProps) {
  const Icon = iconMap[name];
  if (!Icon) return null;
  return <Icon {...props} />;
}
