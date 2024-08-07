"use server"

import db from "@/db/db"
import { z } from "zod"
import fs from "fs/promises"
import { notFound, redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

// Definir un esquema para un objeto de archivo
const fileSchema = z.object({
  name: z.string(),
  size: z.number().min(1, { message: "Required" }),
  type: z.string().regex(/^image\//, { message: "Must be an image" }),
})

const addSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  priceInCents: z.coerce.number().int().min(1),
  file: fileSchema,
  image: fileSchema,
})

export async function addProduct(prevState: unknown, formData: FormData) {
  const entries = Object.fromEntries(formData.entries())
  
  const file = formData.get("file") as File;
  const image = formData.get("image") as File;
  
  // Asegurarse de que los archivos existen y transformarlos en objetos compatibles con el esquema
  if (file) {
    entries.file = new File([file], file.name, {
      type: file.type,
      lastModified: file.lastModified,
    });
  }
  
  if (image) {
    entries.image = new File([image], image.name, {
      type: image.type,
      lastModified: image.lastModified,
    });
  }

  const result = addSchema.safeParse(entries)
  if (result.success === false) {
    return result.error.formErrors.fieldErrors
  }

  const data = result.data

  await fs.mkdir("products", { recursive: true })
  const filePath = `products/${crypto.randomUUID()}-${file.name}`
  await fs.writeFile(filePath, Buffer.from(await file.arrayBuffer()))

  await fs.mkdir("public/products", { recursive: true })
  const imagePath = `/products/${crypto.randomUUID()}-${image.name}`
  await fs.writeFile(
    `public${imagePath}`,
    Buffer.from(await image.arrayBuffer())
  )

  await db.product.create({
    data: {
      isAvailableForPurchase: false,
      name: data.name,
      description: data.description,
      priceInCents: data.priceInCents,
      filePath,
      imagePath,
    },
  })

  revalidatePath("/")
  revalidatePath("/products")

  redirect("/admin/products")
}



const editSchema = addSchema.extend({
  file: fileSchema.optional(),
  image: fileSchema.optional(),
})

export async function updateProduct(
  id: string,
  prevState: unknown,
  formData: FormData
) {
  const entries = Object.fromEntries(formData.entries())

  const file = formData.get("file") as File;
  const image = formData.get("image") as File;

  if (file && file.size > 0) {
    entries.file = new File([file], file.name, {
      type: file.type,
      lastModified: file.lastModified,
    });
  }

  if (image && image.size > 0) {
    entries.image = new File([image], image.name, {
      type: image.type,
      lastModified: image.lastModified,
    });
  }

  const result = editSchema.safeParse(entries)
  if (result.success === false) {
    return result.error.formErrors.fieldErrors
  }

  const data = result.data
  const product = await db.product.findUnique({ where: { id } })

  if (product == null) return notFound()

  let filePath = product.filePath
  if (data.file && data.file.size > 0) {
    await fs.unlink(product.filePath)
    filePath = `products/${crypto.randomUUID()}-${file.name}`
    await fs.writeFile(filePath, Buffer.from(await file.arrayBuffer()))
  }

  let imagePath = product.imagePath
  if (data.image && data.image.size > 0) {
    await fs.unlink(`public${product.imagePath}`)
    imagePath = `/products/${crypto.randomUUID()}-${image.name}`
    await fs.writeFile(
      `public${imagePath}`,
      Buffer.from(await image.arrayBuffer())
    )
  }

  await db.product.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      priceInCents: data.priceInCents,
      filePath,
      imagePath,
    },
  })

  revalidatePath("/")
  revalidatePath("/products")

  redirect("/admin/products")
}
