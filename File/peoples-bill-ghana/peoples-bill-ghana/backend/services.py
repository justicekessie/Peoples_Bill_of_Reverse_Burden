"""
Business logic services for bill generation and statistics
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
import re

from models import Submission, Cluster, BillClause, Vote, Region

class BillService:
    """Service for generating bill clauses from clusters"""
    
    def generate_clause(self, cluster: Cluster, submissions: List[Submission]) -> Dict:
        """
        Generate a bill clause from a cluster of submissions
        Returns dict with clause content, title, and rationale
        """
        
        # Templates for different types of clauses
        clause_templates = {
            "Asset Declaration": {
                "title": "Asset Declaration Requirements",
                "template": "Every public officer shall, within {timeframe} of assumption of office and {frequency} thereafter, submit to the Office of the Special Prosecutor a comprehensive declaration of assets, liabilities, and business interests, including those of their spouse and children under eighteen years of age.",
                "rationale": "Ensures transparency and accountability in public service"
            },
            "Unexplained Wealth": {
                "title": "Presumption of Unexplained Wealth",
                "template": "Where the Office of the Special Prosecutor has reasonable grounds to believe that a public officer owns property or has pecuniary resources disproportionate to their known sources of income, the burden of proof shall shift to the officer to demonstrate that such assets were lawfully acquired.",
                "rationale": "Implements reverse burden of proof for unexplained wealth"
            },
            "Investigation Process": {
                "title": "Investigation Procedures",
                "template": "Upon receipt of credible information or citizen petition regarding unexplained wealth, the Office of the Special Prosecutor shall, within {timeframe} days, commence preliminary investigations and notify the concerned public officer in writing of the nature of the inquiry.",
                "rationale": "Establishes clear investigation procedures"
            },
            "Asset Confiscation": {
                "title": "Confiscation of Unexplained Assets",
                "template": "Where a public officer fails to satisfactorily explain the lawful origin of assets deemed disproportionate to their income, the High Court shall, upon application by the Office of the Special Prosecutor, order the confiscation of such assets to the State.",
                "rationale": "Provides for recovery of illicitly acquired assets"
            },
            "Fair Hearing Rights": {
                "title": "Right to Fair Hearing",
                "template": "Every person subject to investigation under this Act shall have the right to: (a) receive written notice of the investigation; (b) legal representation of their choice; (c) present evidence in their defense; (d) cross-examine witnesses; and (e) appeal any adverse determination to a higher court.",
                "rationale": "Protects constitutional rights during investigations"
            },
            "Penalties and Sanctions": {
                "title": "Penalties for Violation",
                "template": "Any public officer found guilty of possessing unexplained wealth shall be: (a) liable to a fine not exceeding three times the value of the unexplained assets; (b) disqualified from holding public office for a period not less than {years} years; and (c) subject to imprisonment for a term not exceeding {prison_term} years.",
                "rationale": "Establishes deterrent penalties"
            },
            "Whistleblower Protection": {
                "title": "Protection of Whistleblowers",
                "template": "Any person who, in good faith, provides information leading to the discovery of unexplained wealth shall be: (a) protected from victimization, discrimination, or retaliatory action; (b) entitled to witness protection where necessary; and (c) eligible for a reward not exceeding {percentage}% of recovered assets.",
                "rationale": "Encourages reporting of corruption"
            }
        }
        
        # Determine clause type based on cluster theme
        theme = cluster.theme
        matching_template = None
        
        for template_key, template_data in clause_templates.items():
            if template_key.lower() in theme.lower() or theme.lower() in template_key.lower():
                matching_template = template_data
                break
        
        # Default template if no match
        if not matching_template:
            matching_template = {
                "title": f"Provision for {theme}",
                "template": f"The Office of the Special Prosecutor shall have the power to implement measures regarding {theme.lower()} as determined necessary for the effective administration of this Act.",
                "rationale": f"Addresses citizen concerns about {theme.lower()}"
            }
        
        # Fill in template variables based on submissions
        clause_content = matching_template["template"]
        
        # Simple keyword extraction for template filling
        timeframes = self._extract_timeframes(submissions)
        frequencies = self._extract_frequencies(submissions)
        penalties = self._extract_penalties(submissions)
        
        # Replace template variables
        replacements = {
            "{timeframe}": timeframes.get("declaration", "thirty (30) days"),
            "{frequency}": frequencies.get("declaration", "every two (2) years"),
            "{years}": penalties.get("disqualification", "ten (10)"),
            "{prison_term}": penalties.get("imprisonment", "five (5)"),
            "{percentage}": "10"
        }
        
        for key, value in replacements.items():
            clause_content = clause_content.replace(key, value)
        
        # Calculate confidence based on cluster metrics
        confidence = cluster.confidence_score
        if len(submissions) > 10:
            confidence = min(confidence + 0.1, 1.0)
        
        return {
            "title": matching_template["title"],
            "content": clause_content,
            "rationale": matching_template["rationale"],
            "confidence": confidence,
            "based_on_submissions": len(submissions)
        }
    
    def _extract_timeframes(self, submissions: List[Submission]) -> Dict[str, str]:
        """Extract timeframe mentions from submissions"""
        timeframes = {}
        
        # Simple pattern matching
        patterns = {
            "days": r"(\d+)\s*days?",
            "months": r"(\d+)\s*months?",
            "years": r"(\d+)\s*years?"
        }
        
        for submission in submissions[:20]:  # Sample first 20
            text = submission.content.lower()
            for unit, pattern in patterns.items():
                matches = re.findall(pattern, text)
                if matches:
                    # Store most common value
                    timeframes["declaration"] = f"{matches[0]} {unit}"
                    break
        
        return timeframes
    
    def _extract_frequencies(self, submissions: List[Submission]) -> Dict[str, str]:
        """Extract frequency mentions from submissions"""
        frequencies = {}
        
        keywords = ["yearly", "annually", "every year", "every two years", "biannually"]
        
        for submission in submissions[:20]:
            text = submission.content.lower()
            for keyword in keywords:
                if keyword in text:
                    if "two" in keyword or "bi" in keyword:
                        frequencies["declaration"] = "every two (2) years"
                    else:
                        frequencies["declaration"] = "annually"
                    break
        
        return frequencies
    
    def _extract_penalties(self, submissions: List[Submission]) -> Dict[str, str]:
        """Extract penalty suggestions from submissions"""
        penalties = {}
        
        # Look for year mentions in context of penalties
        for submission in submissions[:20]:
            text = submission.content.lower()
            
            # Disqualification years
            if "disqualif" in text or "ban" in text:
                years = re.findall(r"(\d+)\s*years?", text)
                if years:
                    penalties["disqualification"] = years[0]
            
            # Prison terms
            if "prison" in text or "jail" in text or "imprison" in text:
                years = re.findall(r"(\d+)\s*years?", text)
                if years:
                    penalties["imprisonment"] = years[0]
        
        return penalties
    
    def validate_clause(self, clause_content: str) -> Dict[str, Any]:
        """Validate a bill clause for legal formatting"""
        issues = []
        
        # Check minimum length
        if len(clause_content) < 50:
            issues.append("Clause is too short")
        
        # Check for required legal language
        legal_keywords = ["shall", "may", "pursuant", "notwithstanding", "provided"]
        if not any(keyword in clause_content.lower() for keyword in legal_keywords):
            issues.append("Missing formal legal language")
        
        # Check for clear subject
        if not any(term in clause_content.lower() for term in ["officer", "person", "prosecutor", "court"]):
            issues.append("Unclear subject of the clause")
        
        return {
            "is_valid": len(issues) == 0,
            "issues": issues,
            "suggestions": self._get_improvement_suggestions(issues)
        }
    
    def _get_improvement_suggestions(self, issues: List[str]) -> List[str]:
        """Get suggestions for improving a clause"""
        suggestions = []
        
        if "too short" in str(issues):
            suggestions.append("Expand the clause with more specific details")
        
        if "legal language" in str(issues):
            suggestions.append("Use formal legal terms like 'shall', 'pursuant to', etc.")
        
        if "Unclear subject" in str(issues):
            suggestions.append("Clearly identify who is subject to this provision")
        
        return suggestions


class StatsService:
    """Service for generating platform statistics"""
    
    def get_platform_stats(self, db: Session) -> Dict[str, Any]:
        """Get comprehensive platform statistics"""
        
        # Total submissions
        total_submissions = db.query(Submission).count()
        
        # Approved submissions
        approved_submissions = db.query(Submission).filter(
            Submission.status == "approved"
        ).count()
        
        # Total unique contributors (estimate based on regions/demographics)
        total_contributors = db.query(
            func.count(func.distinct(Submission.region))
        ).scalar() or 0
        
        # Regions represented
        regions_represented = db.query(
            func.count(func.distinct(Submission.region))
        ).scalar() or 0
        
        # Clusters formed
        clusters_formed = db.query(Cluster).count()
        
        # Clauses drafted
        clauses_drafted = db.query(BillClause).count()
        
        # Average approval rate
        votes = db.query(Vote).all()
        if votes:
            approvals = sum(1 for v in votes if v.vote_value == "approve")
            approval_rate = (approvals / len(votes)) * 100
        else:
            approval_rate = 0.0
        
        # Submissions by region
        region_stats = db.query(
            Submission.region,
            func.count(Submission.id).label('count')
        ).group_by(Submission.region).all()
        
        submissions_by_region = {
            stat.region: stat.count for stat in region_stats
        }
        
        # Submissions over time (last 30 days)
        thirty_days_ago = datetime.now() - timedelta(days=30)
        time_series = db.query(
            func.date(Submission.created_at).label('date'),
            func.count(Submission.id).label('count')
        ).filter(
            Submission.created_at >= thirty_days_ago
        ).group_by(
            func.date(Submission.created_at)
        ).all()
        
        submissions_over_time = [
            {
                "date": str(item.date),
                "count": item.count
            }
            for item in time_series
        ]
        
        # Top themes (from clusters)
        clusters = db.query(Cluster).all()
        top_themes = []
        
        for cluster in clusters[:5]:  # Top 5 themes
            submission_count = db.query(Submission).filter(
                Submission.cluster_id == cluster.id
            ).count()
            
            top_themes.append({
                "theme": cluster.theme,
                "submissions": submission_count,
                "confidence": cluster.confidence_score
            })
        
        # Sort themes by submission count
        top_themes.sort(key=lambda x: x["submissions"], reverse=True)
        
        return {
            "total_submissions": total_submissions,
            "approved_submissions": approved_submissions,
            "total_contributors": total_contributors * 50,  # Estimate multiplier
            "regions_represented": regions_represented,
            "clusters_formed": clusters_formed,
            "clauses_drafted": clauses_drafted,
            "average_approval_rate": round(approval_rate, 1),
            "submissions_by_region": submissions_by_region,
            "submissions_over_time": submissions_over_time,
            "top_themes": top_themes,
            "participation_rate": self._calculate_participation_rate(
                submissions_by_region,
                db
            ),
            "last_updated": datetime.now().isoformat()
        }
    
    def _calculate_participation_rate(
        self, 
        submissions_by_region: Dict[str, int],
        db: Session
    ) -> Dict[str, Any]:
        """Calculate participation rates by region"""
        
        # Get all regions with population
        regions = db.query(Region).all()
        
        if not regions:
            return {"overall": 0.0, "by_region": {}}
        
        total_population = sum(r.population for r in regions if r.population)
        
        # Estimate participants (rough calculation)
        # Assume each submission represents 10-20 unique participants
        estimated_participants = sum(submissions_by_region.values()) * 15
        
        overall_rate = (estimated_participants / total_population) * 100 if total_population > 0 else 0
        
        # By region
        by_region = {}
        for region in regions:
            if region.name in submissions_by_region and region.population:
                regional_participants = submissions_by_region[region.name] * 15
                rate = (regional_participants / region.population) * 100
                by_region[region.name] = round(rate, 3)
            else:
                by_region[region.name] = 0.0
        
        return {
            "overall": round(overall_rate, 3),
            "by_region": by_region,
            "estimated_participants": estimated_participants
        }
    
    def get_cluster_details(self, cluster_id: int, db: Session) -> Dict[str, Any]:
        """Get detailed statistics for a specific cluster"""
        
        cluster = db.query(Cluster).filter(Cluster.id == cluster_id).first()
        if not cluster:
            return {}
        
        # Get all submissions in this cluster
        submissions = db.query(Submission).filter(
            Submission.cluster_id == cluster_id
        ).all()
        
        # Demographics
        age_groups = {"18-25": 0, "26-35": 0, "36-45": 0, "46-55": 0, "56+": 0}
        occupations = {}
        regions = {}
        
        for sub in submissions:
            # Age groups
            if sub.age:
                if sub.age <= 25:
                    age_groups["18-25"] += 1
                elif sub.age <= 35:
                    age_groups["26-35"] += 1
                elif sub.age <= 45:
                    age_groups["36-45"] += 1
                elif sub.age <= 55:
                    age_groups["46-55"] += 1
                else:
                    age_groups["56+"] += 1
            
            # Occupations
            if sub.occupation:
                occupations[sub.occupation] = occupations.get(sub.occupation, 0) + 1
            
            # Regions
            regions[sub.region] = regions.get(sub.region, 0) + 1
        
        # Get related bill clause if exists
        bill_clause = db.query(BillClause).filter(
            BillClause.cluster_id == cluster_id
        ).first()
        
        return {
            "cluster_id": cluster_id,
            "theme": cluster.theme,
            "summary": cluster.summary,
            "total_submissions": len(submissions),
            "confidence_score": cluster.confidence_score,
            "keywords": cluster.keywords or [],
            "demographics": {
                "age_groups": age_groups,
                "top_occupations": dict(sorted(
                    occupations.items(), 
                    key=lambda x: x[1], 
                    reverse=True
                )[:5]),
                "regions": regions
            },
            "bill_clause": {
                "exists": bill_clause is not None,
                "section": bill_clause.section_number if bill_clause else None,
                "title": bill_clause.title if bill_clause else None
            },
            "created_at": cluster.created_at.isoformat() if cluster.created_at else None
        }


# Service instances
bill_service = BillService()
stats_service = StatsService()
