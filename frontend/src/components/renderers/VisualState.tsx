"use client";

import type { ReactNode } from "react";
import { POINTER_NAMES, plainFromTyped } from "@/lib/format";
import type { Change, TypedValue } from "@/lib/trace-types";
import { ArrayRenderer } from "./ArrayRenderer";
import { DictRenderer } from "./DictRenderer";
import { HeapRenderer } from "./HeapRenderer";
import { LinkedListRenderer } from "./LinkedListRenderer";
import { MatrixRenderer } from "./MatrixRenderer";
import { QueueRenderer } from "./QueueRenderer";
import { SetRenderer } from "./SetRenderer";
import { StackRenderer } from "./StackRenderer";
import { TreeRenderer } from "./TreeRenderer";
import { VariableTable } from "./VariableTable";

type Props = {
  locals: Record<string, TypedValue>;
  changes: Change[];
  muteUnchanged?: boolean;
};

export function VisualState({ locals, changes, muteUnchanged }: Props) {
  const pointers: Record<string, number> = {};
  for (const [name, tv] of Object.entries(locals)) {
    if (POINTER_NAMES.has(name) && tv.type === "int" && typeof tv.value === "number") {
      pointers[name] = tv.value;
    }
  }

  const structures: ReactNode[] = [];
  const seen = new Set<string>();

  const push = (key: string, node: ReactNode) => {
    if (seen.has(key)) return;
    seen.add(key);
    structures.push(node);
  };

  for (const [name, tv] of Object.entries(locals)) {
    switch (tv.type) {
      case "matrix": {
        const rows = (plainFromTyped(tv) as unknown[][]) || [];
        push(name, <MatrixRenderer key={name} name={name} rows={rows} />);
        break;
      }
      case "tree": {
        const nodes = (plainFromTyped(tv) as (unknown | null)[]) || [];
        push(name, <TreeRenderer key={name} name={name} nodes={nodes} />);
        break;
      }
      case "linked_list": {
        const nodes = (plainFromTyped(tv) as unknown[]) || [];
        push(
          name,
          <LinkedListRenderer key={name} name={name} nodes={nodes} pointers={{}} />,
        );
        break;
      }
      case "set": {
        const items = (plainFromTyped(tv) as unknown[]) || [];
        push(name, <SetRenderer key={name} name={name} items={items} />);
        break;
      }
      case "stack": {
        const items = (plainFromTyped(tv) as unknown[]) || [];
        push(name, <StackRenderer key={name} name={name} items={items} />);
        break;
      }
      case "queue": {
        const items = (plainFromTyped(tv) as unknown[]) || [];
        push(name, <QueueRenderer key={name} name={name} items={items} />);
        break;
      }
      case "heap": {
        const items = (plainFromTyped(tv) as unknown[]) || [];
        push(name, <HeapRenderer key={name} name={name} items={items} />);
        break;
      }
      case "list":
      case "tuple": {
        const items = (plainFromTyped(tv) as unknown[]) || [];
        push(
          name,
          <ArrayRenderer
            key={name}
            name={name}
            items={items}
            pointers={pointers}
          />,
        );
        break;
      }
      case "str": {
        if (typeof tv.value === "string" && tv.value.length > 1) {
          push(
            name,
            <ArrayRenderer
              key={name}
              name={name}
              items={tv.value.split("")}
              pointers={pointers}
            />,
          );
        }
        break;
      }
      case "dict": {
        const entries = Array.isArray(tv.value)
          ? (tv.value as { key: TypedValue; value: TypedValue }[]).map((p) => ({
              key: plainFromTyped(p.key),
              value: plainFromTyped(p.value),
            }))
          : [];
        const changedKeys = new Set(
          changes
            .filter((c) => c.name === name)
            .flatMap((c) => {
              if (c.after && typeof c.after === "object" && !Array.isArray(c.after)) {
                return Object.keys(c.after as object);
              }
              return [];
            }),
        );
        push(
          name,
          <DictRenderer
            key={name}
            name={name}
            entries={entries}
            changedKeys={changedKeys}
          />,
        );
        break;
      }
      default:
        break;
    }
  }

  return (
    <div className="visual-state">
      {structures.length === 0 && (
        <div className="muted">No structured values to draw yet — check the variable table.</div>
      )}
      {structures}
      <VariableTable
        locals={locals}
        changes={changes}
        muteUnchanged={muteUnchanged}
      />
    </div>
  );
}
