import { Box, Link, Typography } from "@mui/material"

const Impressum = () => {
    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Impressum
            </Typography>

            <Typography variant="h6" gutterBottom>
                Herausgeber
            </Typography>
            <Typography variant="body1" gutterBottom>
                Johannes Middelberg<br />
                c/o Block Services<br />
                Stuttgarter Str. 106<br />
                70736 Fellbach<br />
                DE - Deutschland<br />
                E-Mail: <Link href="mailto:info@der-witz-des-tages.de">info@der-witz-des-tages.de</Link><br />
            </Typography>

            <Typography sx={{ mt: 5 }} variant="h6" gutterBottom>
                Urheberrecht
            </Typography>
            <Typography variant="body1" gutterBottom>
                Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht.
                Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes
                bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite sind
                nur für den privaten, nicht kommerziellen Gebrauch gestattet. Soweit die Inhalte auf dieser Seite nicht vom Betreiber
                erstellt wurden, werden die Urheberrechte Dritter beachtet. Insbesondere werden Inhalte Dritter als solche gekennzeichnet.
                Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam werden, bitte ich um einen entsprechenden Hinweis.
                Bei Bekanntwerden von Rechtsverletzungen werde ich derartige Inhalte umgehend entfernen.
            </Typography>

            <Typography variant="h6" gutterBottom>
                Hinweis
            </Typography>
            <Typography variant="body1" gutterBottom>
                Für Vollständigkeit, Fehler redaktioneller und technischer Art, Auslassungen usw. sowie die Richtigkeit der Eintragungen
                kann keine Haftung übernommen werden. Ich behalte mir das Recht vor, ohne vorherige Ankündigung die bereitgestellten
                Informationen zu ändern, zu ergänzen oder zu entfernen.
            </Typography>

            <Typography variant="h6" gutterBottom>
                Haftungshinweis
            </Typography>
            <Typography variant="body1" gutterBottom>
                Trotz sorgfältiger inhaltlicher Kontrolle übernehme ich keine Haftung für die Inhalte externer Links. Für den Inhalt
                der verlinkten Seiten sind ausschließlich deren Betreiber verantwortlich. Falls ich auf Seiten verweise, deren Inhalt
                Anlass zur Beanstandung gibt, bitte ich um Mitteilung.
            </Typography>
        </Box>
    )
}

export default Impressum;