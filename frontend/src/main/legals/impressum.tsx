import { Box, Link, Typography } from "@mui/material"

const Impressum = () => {
    return (
        <Box>
            <Typography variant="h4" component="h1" gutterBottom>
                Impressum
            </Typography>

            <Typography variant="h6" component="h2" gutterBottom>
                Herausgeber
            </Typography>
            <Typography variant="body1" gutterBottom>
                Johannes Middelberg<br />
                E-Mail: <Link href="mailto:info@shareframe.de">info@shareframe.de</Link><br />
            </Typography>

            <Typography sx={{ mt: 5 }} variant="h6" component="h2" gutterBottom>
                Urheberrecht
            </Typography>
            <Typography variant="body1" gutterBottom>
                Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht.
                Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes
                bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite sind
                nur für den privaten, nicht kommerziellen Gebrauch gestattet. Soweit die Inhalte auf dieser Seite nicht vom Betreiber
                erstellt wurden, werden die Urheberrechte Dritter beachtet. Von Nutzern hochgeladene Fotos und Texte sind nicht öffentlich
                und liegen in der Verantwortung der jeweiligen Nutzer. Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam werden, bitte ich um einen entsprechenden Hinweis.
                Bei Bekanntwerden von Rechtsverletzungen werde ich derartige Inhalte umgehend entfernen.
            </Typography>

            <Typography variant="h6" component="h2" gutterBottom>
                Hinweis
            </Typography>
            <Typography variant="body1" gutterBottom>
                Für die Vollständigkeit und Richtigkeit der bereitgestellten Informationen wird keine Gewähr übernommen. Im Übrigen hafte
                ich nach den gesetzlichen Vorschriften. Ich behalte mir das Recht vor, ohne vorherige Ankündigung die bereitgestellten
                Informationen zu ändern, zu ergänzen oder zu entfernen.
            </Typography>

            <Typography variant="h6" component="h2" gutterBottom>
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