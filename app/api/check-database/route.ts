import { NextResponse } from "next/server"
import { getInstantService } from "@/lib/instant/service"

export async function GET() {
  try {
    // Usa il client di servizio per verificare il database
    const serviceClient = getInstantService()

    // Verifica se la tabella profiles esiste
    const { data: profilesData, error: profilesError } = await serviceClient.from("profiles").select("count").limit(1)

    if (profilesError) {
      return NextResponse.json({
        success: false,
        message: `Errore nella verifica della tabella profiles: ${profilesError.message}`,
      })
    }

    // Verifica se la tabella business_settings esiste
    const { data: settingsData, error: settingsError } = await serviceClient
      .from("business_settings")
      .select("count")
      .limit(1)

    if (settingsError) {
      return NextResponse.json({
        success: false,
        message: `Errore nella verifica della tabella business_settings: ${settingsError.message}`,
      })
    }

    // Verifica lo stato di RLS sulla tabella profiles
    const { data: rlsData, error: rlsError } = await serviceClient.rpc("exec_sql", {
      sql: `
      SELECT relrowsecurity as rls_enabled
      FROM pg_class
      WHERE oid = 'profiles'::regclass;
      `,
    })

    const rlsEnabled = rlsData && rlsData.length > 0 ? rlsData[0].rls_enabled : null

    return NextResponse.json({
      success: true,
      profiles: {
        exists: true,
        count: profilesData ? profilesData.length : 0,
      },
      settings: {
        exists: true,
        count: settingsData ? settingsData.length : 0,
      },
      rls: {
        checked: rlsError ? false : true,
        enabled: rlsEnabled,
      },
    })
  } catch (error) {
    console.error("Errore nell'API check-database:", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Errore interno del server",
      },
      { status: 500 },
    )
  }
}

