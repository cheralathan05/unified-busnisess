// auto-generated
// prisma/extensions/softDelete.ts

import { Prisma } from "@prisma/client";

export const softDeleteExtension = Prisma.defineExtension({
  name: "softDelete",

  query: {
    $allModels: {
      async delete({ model, args, query }) {
        return (query as any)({
          ...args,
          data: {
            deletedAt: new Date(),
          },
        });
      },

      async deleteMany({ model, args, query }) {
        return (query as any)({
          ...args,
          data: {
            deletedAt: new Date(),
          },
        });
      },

      async findMany({ args, query }) {
        args.where = {
          ...args.where,
          deletedAt: null,
        };
        return query(args);
      },

      async findFirst({ args, query }) {
        args.where = {
          ...args.where,
          deletedAt: null,
        };
        return query(args);
      },

      async findUnique({ args, query }) {
        return query(args); // keep as-is (important)
      },
    },
  },
});